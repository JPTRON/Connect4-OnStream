const { ipcRenderer} = require("electron");
const Dialogs = require('dialogs');
const dialogs = Dialogs();

const delay = ms => new Promise(res => setTimeout(res, ms));

var rows = document.getElementById("board").getElementsByTagName("tr");

async function play()
{
    var channel = document.getElementById("channel").value;
    var drawTime = document.getElementById("drawTime").value;
    
    if(channel == "" || drawTime == "" || isNaN(drawTime) || drawTime <= 0 || drawTime % 1 != 0) //Validations
    {
        dialogs.alert('Fill every input correctly!');
        return;
    }

    clear();

    document.getElementById("playButton").disabled = true;
    ipcRenderer.send("startGame", [channel, drawTime]); //Sends a signal to ipcMain
    await delay(1500);
    document.getElementById("playButton").disabled = false;
}

function clear()
{
    var cells = document.getElementsByClassName("cell");

    for(i = 0; i < cells.length; i++)
    {
        cells[i].className = "cell empty";
    };

    document.getElementById("teamTurn").className = "team1";
}

function fill(cell, team) //Fills the cell by switching classes
{
    for(i = 5; i >= 0; i--) //Loops within the row cells to fill the correct cell
    {
        var rowCells = rows[i].getElementsByTagName("td");

        if(rowCells[cell] && rowCells[cell].classList.contains("empty")) //if the cell is empty, fills it and breaks the loop, otherwise continues and tries to fill the cell above
        {          
            rowCells[cell].classList.remove("empty");
            team === 1 ? rowCells[cell].classList.add("team1") : rowCells[cell].classList.add("team2");

            var won = checkVictory(cell, i, rowCells[cell].classList[1]);

            if(won)
            {
                var teamName;
                team === 1 ? teamName = "Red Team" : "Yellow Team";

                dialogs.alert(`${teamName} Won!`);
                ipcRenderer.send("victory", {}); //Sends a signal to ipcMain
            }
            else
            {
                ipcRenderer.send("endTurn", {}); //Sends a signal to ipcMain
            }
            
            var teamTurn = document.getElementById("teamTurn");
            teamTurn.className === "team1" ? teamTurn.className = "team2" : teamTurn.className = "team1";

            break;
        }
    }
}

function checkVictory(x, y, team)
{
    var won = 0;
    var connected = 1;

    var originalX = x;
    var originalY = y;
    var originalCell = rows[y].getElementsByTagName("td")[x];

    for(d = 0; d < 8; d++) //loops withing 8 directions
    {
        if(d == 2 || d == 4 || d == 6) //resets the number of connected cells when changings axis so it doesn't miscounts
        {
            connected = 1;
        }

        for(i = 1; i < 4; i++)
        {
            switch(d)
            {
                case 0:
                    x = originalX-i; //left
                    break;
                case 1:
                    x = originalX+i; //right
                    break;
                case 2:
                    y = originalY - i; //up 
                    x = originalX; 
                    break;
                case 3:
                    y = originalY + i; //down
                    x = originalX; 
                    break;
                case 4:
                    y = originalY + i; //down left
                    x = originalX-i;
                    break;
                case 5:
                    y = originalY - i; //up right
                    x = originalX+i;
                    break;       
                case 6:
                    y = originalY + i; //down right
                    x = originalX+i;
                    break;    
                case 7:
                    y = originalY - i; //up left
                    x = originalX-i;
                    break;            
            }

            if(rows[y])
            {
                var rowCells = rows[y].getElementsByTagName("td");

                if(rowCells[x] && rowCells[x].classList.contains(team) && rowCells[x] !== originalCell) //checks if the cells has the same color
                {
                    connected += 1;
                }
                else
                {
                    break;
                }
        
                if(connected === 4)
                {
                    won = 1;
                    return won;
                }
            }
        }
    }

    return won;
}