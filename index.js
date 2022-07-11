const { app, BrowserWindow, ipcRenderer, ipcMain } = require('electron');
const tmi = require('tmi.js');
const axios = require('axios');

var streamer = "";
var drawTime;

var win;
var client;
var player;
var players = [];
var team = 1;
var played = 0;
var myTimeout;

const createWindow = () =>  //Creates app's window
{
    win = new BrowserWindow
    ({
        width: 380,
        height: 600,
        resizable: false,
        webPreferences: {
            contextIsolation: false,
            enableRemoteModule: true,
            nodeIntegration: true,
            nativeWindowOpen: true
        }
    });
    
    win.removeMenu();
    win.loadFile('app/index.html');
}

app.whenReady().then(() => 
{
    createWindow();
})

app.on('window-all-closed', () => 
{
    if (process.platform !== 'darwin') { app.quit(); }
})

function createClient() //Creates a TMI's client and connects it to the channel
{
    client = new tmi.Client
    ({
        channels: [ streamer ]
    });

    client.connect();
    drawPlayer();
    listen();
}

async function drawPlayer() //Draws a new player
{
    var chatters = await getChatters();
    player = chatters[Math.floor(Math.random() * chatters.length)];
    win.webContents.executeJavaScript(`document.getElementById("playerName").innerHTML = "<b>${player}'s turn</b>";`); //Sends the player's name to the main page
    played = 0;
}

function getChatters() //Gets all the chatters
{ 
    return new Promise((resolve, reject) => {
        axios.get(`https://tmi.twitch.tv/group/user/${streamer}/chatters`) //Twitch API's endpoint that returns the chatters
        .then(function (response) 
        {
            var list = [];

            var keys = Object.keys(response.data.chatters);
            
            for(i = 0; i < keys.length; i++) //Gets each individual value and adds it to the 'chatters' array
            {
                var values = response.data.chatters[keys[i]];

                for(j = 0; j < values.length; j++)
                {
                    if((values[j] !== player && !players[j]) || (values[j] !== player && (players[j] && players[j].team == team))) //Doesn't push if the value is equal to the previous player or the player is from the other team
                    {
                        list.push(values[j]);
                    }
                }
            }

            resolve(list);
        })
        .catch(function (error) 
        {
            console.log(error);
        });
    });
}

function listen() //Listens to the new player's next message
{
    try //Clears previous intervals so it doesn't spam new draws
    {
        clearInterval(myTimeout);
    } 
    catch (error) {}
    
    myTimeout = setInterval(function (){drawPlayer();}, drawTime * 1000); //Draws a player each "drawTime" seconds

    client.on('message', (channel, tags, message, self) => 
    {
        if(tags['display-name'].toLowerCase() === player && message.startsWith("-c4") && played === 0)
        {
            var arguments = message.split("-c4");
            var cell = arguments[1];

            if(cell >= 1 && cell <= 7)
            {
                played = 1;
                play(cell);
            }
        }   
    });
}

function play(cell) 
{
    var playerObj = {"name": player, "team": team};

    if(!players.includes(playerObj)) //if the player doesn't have a team adds him to the "players" array
    {
        players.push(playerObj);
    }

    win.webContents.executeJavaScript(`fill(${cell-1}, ${team});`); //Executes the script to fill the board's cell
}

ipcMain.on("startGame", async (event, args) => //Listens to the 'start' signal so it can start the game
{
    streamer = args[0].toLowerCase();
    drawTime = args[1];
    player = "";
    players = [];
    team = 1;
    played = 0

    createClient();
});

ipcMain.on("endTurn", async (event) => //Listens to the 'endTurn' signal so it draws a new player
{
    team === 1 ? team = 2 : team = 1;
    drawPlayer();
});

ipcMain.on("victory", async (event) => //Listens to the 'endTurn' signal so it can checks the victory and draw a new player
{
    clearInterval(myTimeout);
    client.disconnect();
});