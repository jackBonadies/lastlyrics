const setupEvents = require('./installers/setupEvents')
if(setupEvenbts.handleSquirrelEvent()){
    return;
}
var fs = require("fs");
const https = require('https');
let user = "lastpriest";
let lyrics;
var JSSoup = require('jssoup').default

const {app} = require('electron')
const { BrowserWindow, ipcMain } = require('electron')
var events = require('events');
const url = require('url')
const path = require('path')
let interalEE = new events.EventEmitter();
app.on("ready",()=>{
    let mainWin = new BrowserWindow({  backgroundColor: '#212121', width: 800, height: 600, show:false, webPreferences:{
        nodeIntegration: true
    } })
    mainWin.on('closed', () => {
        mainWin = null
    })
    console.log(`${__dirname}`)
    mainWin.loadURL(url.format({
        pathname: path.join(__dirname,'lyricspage.html'),
        protocol: 'file',
        slashes: true
    }))
    mainWin.on("ready-to-show",()=>{
        mainWin.show()
        mainWin.webContents.send("username",user)
    })
    //catch update:lyrics
    ipcMain.on("update:lyrics",(e)=>{
        console.log("lets update the lyrics")
        try{
        console.log(lyrics[0].text)
        var item1 = lyrics[0].text
        mainWin.webContents.send("updated:lyrics",item1)
        }catch{

        }
    })
    ipcMain.on("update:track",(e)=>{
        updateTrack(mainWin);
    })
    ipcMain.on("update:user",(e,newUser)=>{
        mainWin.webContents.send("update:user",newUser);
        console.log(newUser);
        user=newUser;
        mainWin.webContents.send("username",user);
    })


})

function queryGoogle(artistTrack,mainWin){
    track = artistTrack["track"].replace(' ','+')
    artist = artistTrack["artist"].replace(' ','+')
    query = "https://www.google.com/search?q=" + track + "+" + artist +  "+genius"
    console.log(query)
    https.get(query,(resp)=>{
    let data = ''
    resp.on("data",(chunk)=>{
        data+= chunk;
    })
    resp.on("end",()=>{
        console.log("done")
        matchUrl = grabLinkStringMethods(data)
        getLyricsFromGenius(matchUrl,mainWin)
    })
    }).on("error",(err)=>{
        console.log("error");
    })
}

function getLyricsFromGenius(matchUrl,mainWin){
    https.get(matchUrl,(resp)=>{
        let data="";
        resp.on("data",(chunk)=>{
            data+=chunk
        })
        resp.on("end",()=>{
            //console.log(data)
            var soup = new JSSoup(data)
            lyrics = soup.findAll('p');
            console.log("done");
            console.log(lyrics[0].text);
            mainWin.webContents.send("updated:lyrics",lyrics[0].text);
        })   
    })
}
function grabLinkStringMethods(data){
    var match = data.match("https://genius.com/[^&;]+")[0];
    console.log(match)
    return match;
}
//use jsoup to get link.
function grabLink(data){
    var soup = new JSSoup(data)
    var divs = soup.findAll('div',{"class":"r"})
    let searchRes;  //clearly this doesnt get all divs.
    divs.forEach((val)=>{
        if(val.attrs['class']=="r"){
            searchRes = val;
        }
    });
    console.log(searchRes.attrs["class"])
    var divSub = searchRes.find('div')
    console.log(searchRes)
    console.log("done^^")
}

function updateTrack(mainWin){
    https.get("https://www.last.fm/user/" + user,(resp)=>{
        console.log("https://www.last.fm/user/" + user);
        let data="";
        resp.on("data",(chunk)=>{
            data+=chunk
        })
        resp.on("end",()=>{
            //console.log(data)
            console.log("done");
            trackName = data.match(/data-track-name=\"[^\"]+/ig)[2].substring(17);
            console.log(trackName)
            artistName = data.match(/data-artist-name=\"[^\"]+/ig)[2].substring(18);
            console.log(artistName)
            //console.log(theMatch)
            let curTrack = {
                "artist":artistName,
                "track":trackName
            }
            queryGoogle(curTrack,mainWin)
            mainWin.webContents.send("cur:track",curTrack)
            //console.log((lyrics[0].text))

            //update page once u get it....
        })   
        //var soup = new JSSoup(resp)
        //lyrics = soup.findAll('p')
        //console.log(soup)
    })
}
module.exports.user = user;

