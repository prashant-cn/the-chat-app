const socket = io({transports: ['websocket'], upgrade: false})




socket.on('welcomeMessage', (message) => {
    console.log(message.text)
})


const chatForm = document.querySelector('#chatForm')
const chatInput = chatForm.querySelector('input')
const sendButton = chatForm.querySelector('button')
const chatDiv = document.querySelector('#chatDiv')
const sendImageButton = document.querySelector('#sendImage')
const locationButton = document.querySelector('#sendLocation')

let currentroom
let currentuser

//templates
const chatTemplate = document.querySelector('#chatTemplate').innerHTML
const locationTemplate = document.querySelector('#locationTemplate').innerHTML
const imageTemplate = document.querySelector('#imageTemplate').innerHTML
const sidebarTemplate = document.querySelector('#sidebarTemplate').innerHTML

//Query String Options
const { chatWith } = Qs.parse(location.search, { ignoreQueryPrefix: true })

//disable buttons when no is selected to chat 
if(!chatWith){
    sendButton.setAttribute('disabled', 'disabled')
    locationButton.setAttribute('disabled', 'disabled')
    sendImageButton.setAttribute('disabled', 'disabled')
}

const autoScroll = () => { 
    //new message element
    const newMessage = chatDiv.lastElementChild

    //Height of new Message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = chatDiv.offsetHeight

    //height of message container
    const containerHeight = chatDiv.scrollHeight

    //How far from bottom i've scrolled?
    const scrollOffset = chatDiv.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        chatDiv.scrollTop = chatDiv.scrollHeight
    }
}

//convert to Base64
function getBase64(file) {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
      //console.log(reader.result);
      socket.emit('sendImage', 
        { 
            base64data: reader.result, 
            currentuser
        })
    };
    reader.onerror = function (error) {
      console.log('Error: ', error);
    };
 }

//send image button
const inputFile = document.querySelector('input[name="image"]')
count = 1
sendImageButton.addEventListener('click', (event) => {
    inputFile.click()
    // inputFile.addEventListener('change', (event)=>{ // does not work due to event bubbling
    //     console.log(count++)
    //     getBase64(inputFile.files[0])
    //     //inputFile.value = '' //clear the previous image name
    // })
    inputFile.onchange = ()=>{
        console.log(count++)
        getBase64(inputFile.files[0])
    }
})

socket.on('imageMessage', (base64data) => {
    const html = Mustache.render(imageTemplate, {
        username: base64data.username,
        base64data: base64data.text,
        createdAt: moment(base64data.createdAt).format('h:mm a')
    })
    chatDiv.insertAdjacentHTML('beforeend', html)
    autoScroll()
})



socket.on('sendToChat', (msg) => {
    console.log(msg)
    const html = Mustache.render(chatTemplate, { 
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    chatDiv.insertAdjacentHTML('beforeend', html)

    autoScroll()
})



locationButton.addEventListener('click', (event) => {
    if(!navigator.geolocation){
        return alert('Your browser dosenot support GeoLocation')
    }
    locationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', { 
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude,
            currentuser
        }, (ack) => {
            console.log('Location Shared!')
            locationButton.removeAttribute('disabled')
        })
    })
})

socket.on('locationMessage', (link) => {
    const html = Mustache.render(locationTemplate, {
        username: link.username,
        locationURL: link.url,
        createdAt:moment(link.createdAt).format('h:mm a') 
    })
    chatDiv.insertAdjacentHTML('beforeend', html)
    console.log(link)

    autoScroll()
})



// socket.on('roomData', ({room, usersList}) => {
//     const html = Mustache.render(sidebarTemplate, {
//         room,
//         usersList
//     })
//     document.querySelector('#sidebarReplace').innerHTML = html
// })

// self modifications
// socket.on(('roomsList'), (getRoomsList) => {
//     console.log(getRoomsList)
// })








//get loggedin user info
const userDetail = (token)=>{
    let value = document.cookie.match('(^|;)\\s*' + token + '\\s*=\\s*([^;]+)')?.pop() || ''
    fetch("/users/me",
    {
        method: "GET",
        headers: { 'Content-Type': 'application/json',
                    'Authorization': value },
        //body: JSON.stringify(data)
    }).then((response)=>{
        response.json().then((data)=>{
            console.log(data)
            currentroom = `${data._id}+${chatWith}`
            currentuser = data._id
            if(data.error){
                location.href = '/'
            }

            //fetch all users
            let userList = []
            fetch("/users/all",
            {
                method: "GET",
                headers: { 'Content-Type': 'application/json',
                            'Authorization': value },
                //body: JSON.stringify(data)
            }).then((response)=>{
                response.json().then((userList)=>{
                    renderSidebar(userList)
                })
            })

            const renderSidebar = (userList)=>{
                const html = Mustache.render(sidebarTemplate, {
                    user: data,
                    usersList: userList
                })
                document.querySelector('#sidebarReplace').innerHTML = html
                startChat()
            }
            
        })
        
    })
}

userDetail('token')



//logout
const logoutButton = document.querySelector('#logoutButton')

logoutButton.addEventListener('click', (event) => {
    event.preventDefault()

    logoutUser('token')
})

const logoutUser = (token)=>{

    let value = document.cookie.match('(^|;)\\s*' + token + '\\s*=\\s*([^;]+)')?.pop() || ''
    fetch("/users/logout",
    {
        method: "POST",
        headers: { 'Content-Type': 'application/json',
                    'Authorization': value },
        //body: JSON.stringify(data)
    }).then((response)=>{
        response.json().then((data)=>{
            console.log(data)
            location.href = '/'
        })
    })


}

const startChat = () =>{
    if(chatWith){
        socket.emit('chatRoom', { chatWith, currentroom }, (error) => {
            if(error){
                alert(error)
                location.href = '/'
            }
            
        })
    }

}


chatForm.addEventListener('submit', (event) => {
    event.preventDefault()
    sendButton.setAttribute('disabled', 'disabled') 

    const msg = event.target.elements.message.value //Getting value by input name
    socket.emit('sendToChat', {msg, currentuser}, (error) => { //Acknowledgements
        sendButton.removeAttribute('disabled')
        chatInput.value = ''
        chatInput.focus()

        if(error){
            return console.log(error)
        }
        console.log('Delivered')
    })
})