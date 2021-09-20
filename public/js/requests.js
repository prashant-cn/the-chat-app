const userName = document.querySelector("input[name=username]")
const userEmail = document.querySelector("input[name=email]")
const password = document.querySelector("input[name=password]")


const registerUser = (data)=>{
    fetch("/users",
    {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then((response)=>{
        console.log( response)
        location.href="./index.html"
    })
}

//login
const loginUser = (data)=>{
    fetch("/users/login",
    {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then((response)=>{
        response.json().then((data)=>{
            console.log(data)
            if(data.user){
                document.cookie = `token=Bearer ${data.token}`
                location.href='./chat.html'
            }
        })
        
    })
}

