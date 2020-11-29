const e = React.createElement;

function Comments(props) {
    [comments, setComments] = React.useState(undefined);
    [failed, setFailed] = React.useState(false);
    [password, setPassword] = React.useState('');
    [clicks, setClicks] = React.useState(0);
    clicks_timeout = undefined;

    function getComments() {
        fetch(`https://comments-backend-rimple.herokuapp.com/api/comments?password=${password}`)
        .then(resp => {
            if (resp.ok && resp.type) {
                return resp.json();
            } else {
                throw resp.status;
            }
        })
        .then(data => {
            setComments(data);
        })
        .catch(err => {
            console.log(err);
            setFailed(true);
        })
    }

    function deleteComment(comment_id) {
        fetch(`https://comments-backend-rimple.herokuapp.com/api/comments/${comment_id}?password=${password}`, {
            method: 'DELETE'
        })
        .then(resp => {
            if (resp.ok) {
                getComments();
            } else {
                alert('Не удалось удалить данный коммент');
            }
        })
    }

    React.useEffect(
        () => {
            getComments();
            return () => {
                clearTimeout(clicks_timeout);
            };
        },
        []
    );

    function passwordPrompt() {
        if (clicks === 0) {
            setTimeout(() => {
                setClicks(0);
            }, 1000);
        }
        if (clicks < 5) {
            setClicks(clicks+1);
            return;
        }

        setClicks(0);

        let input = prompt('Enter your password');
        if (input) {
            const form = new FormData();
            form.append('password', input);
            fetch(`https://comments-backend-rimple.herokuapp.com/api/testpw`, {
                method: 'POST',
                body: form
            })
            .then(resp => {
                if (resp.ok) {
                    setPassword(input);
                    getComments();
                } else {
                    alert('Пошел нахуй гнида ебаная');
                }
            })
        }
    }

    if (failed) {
        return e(
            'p',
            {},
            'Не удалось получить комменты...'
        );
    } else if (comments === undefined) {
        return e(
            'p',
            {},
            'Загрузка...'
        )
    } else {
        if (comments.length) {
            return e(
                React.Fragment,
                {},
                e(
                    'h3',
                    {
                        style:{color:'#FF00CC'},
                        onClick: passwordPrompt
                    },
                    'Отзывы'
                ),
                comments.map((val, i) => e(
                    'div',
                    {className: 'comment', key:i},
                    e(
                        'h5',
                        {
                            style: {
                                color: 'yellow'
                            }
                        },
                        `${val.User} говорит:`
                    ),
                    e(
                        'p',
                        {},
                        val.Body
                    ),
                    e(
                        'p',
                        {className:'published-time'},
                        `Опубликовано: ${new Date(val.Published * 1000)}` +
                        (password ? `IP: ${val.Ip}` : '')
                    ),
                    ( 
                        password? 
                        e(
                            'button',
                            {onClick:() => deleteComment(val.Id)},
                            'Удалить'
                        ) :
                        null
                    )
                )),
                e(
                    CommentBox,
                    {getComments}
                )
            )
        } else {
            return e(
                React.Fragment,
                {},
                e(
                    'p',
                    {},
                    'Нет отзывов',
                ),
                e(
                    CommentBox,
                    {getComments}
                )
            );
        }
    }
}

function CommentBox(props) {
    [username, setUsername] = React.useState('');
    [body, setBody] = React.useState('');
    [sending, setSending] = React.useState(false);
    [usernameWarning, setUsernameWarning] = React.useState('');
    [bodyWarning, setBodyWarning] = React.useState('');

    function sendMessage(username, message) {
        setUsernameWarning('');
        setBodyWarning('');

        if (!username.length || !message.length) {
            if (!username.length) setUsernameWarning('Введите ваше имя');
            if (!message.length) setBodyWarning('Введите отзыв');
            return;
        }

        setSending(true);

        const form = new FormData();
        form.append('username', username);
        form.append('body', message);

        fetch('https://comments-backend-rimple.herokuapp.com/api/comments', {
            method: 'POST',
            body: form
        })
        .then(resp => {
            if (resp.ok) {
                setUsername('');
                setBody('');
                setSending(false);
                props.getComments();
            } else {
                throw 'failed';
            }
        })
        .catch(err => {
            alert('Не удалось отправить ваш отзыв...');
        })
    }

    if (sending) {
        return e(
            'p',
            {},
            'Отправка...'
        )
    } else {
        return e(
            'div',
            {className:'comment-box'},
            e(
                'input',
                {
                    type:'text', 
                    onChange: (e) => setUsername(e.target.value), 
                    value: username, 
                    onClick: () => setUsernameWarning(''),
                    placeholder: 'Введите ваше имя'
                }
            ),
            ( usernameWarning ? 
                e(
                    'span',
                    {className:'warning'},
                    usernameWarning
                ) :
                null   
            ),
            e(
                'textarea',
                {
                    type:'text',
                    onChange: (e) => setBody(e.target.value), 
                    value: body,
                    onClick: () => setBodyWarning(''),
                    placeholder: 'Введите ваш отзыв',
                }
            ),
            ( bodyWarning ? 
                e(
                    'span',
                    {className:'warning'},
                    bodyWarning
                ) :
                null   
            ),
            e(
                'button',
                {
                    onClick: () => sendMessage(username, body)
                },
                'Отправить'
            )
        )
    }
}

ReactDOM.render(e(Comments), document.getElementById('comments'));