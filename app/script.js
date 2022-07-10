const { ipcRenderer} = require("electron");
const Dialogs = require('dialogs');
const dialogs = Dialogs();

var rows = document.getElementById("board").getElementsByTagName("tr");

function play()
{
    var channel = document.getElementById("channel").value;
    var drawTime = document.getElementById("drawTime").value;
    
    if(channel == "" || drawTime == "" || isNaN(drawTime) || drawTime <= 0 || drawTime % 1 != 0) //Validations
    {
        dialogs.alert('Fill every input correctly!');
        return;
    }

    clear();
    ipcRenderer.send("startGame", [channel, drawTime]); //Sends a signal to ipcMain
}

function clear()
{
    for(i = 0; i < rows.length; i++)
    {
        rows[i].className = "";
        rows[i].classList.add("empty");
    };
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

            var won = checkVictory(cell, i, rowCells[cell].classList);

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

            if(teamTurn.classList.contains("team1"))
            {
                teamTurn.classList.remove("team1");
                teamTurn.classList.add("team2");
            }
            else
            {
                teamTurn.classList.remove("team2");
                teamTurn.classList.add("team1");
            }

            break;
        }
    }
}

function checkVictory(x, y, team)
{
    var won = 0;
    var originalX = x;
    var originalY = y;
    var connected = 1;

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
                    nextCell = x-i; //left
                    break;
                case 1:
                    nextCell = x+i; //right
                    break;
                case 2:
                    y -= 1; //up 
                    nextCell = x; 
                    break;
                case 3:
                    y += 1; //down
                    nextCell = x; 
                    break;
                case 4:
                    y += 1; //down left
                    nextCell = x-i;
                    break;
                case 5:
                    y -= 1; //up right
                    nextCell = x+i;
                    break;       
                case 6:
                    y += 1; //down right
                    nextCell = x+i;
                    break;    
                case 7:
                    y -= 1; //up left
                    nextCell = x-i;
                    break;            
            }

            if(rows[y])
            {
                var rowCells = rows[y].getElementsByTagName("td");

                if(rowCells[nextCell] && rowCells[nextCell].classList.contains(team)) //checks if the cells has the same color
                {
                    currentDirection = "left";
                    connected += 1;
                }
        
                if(connected === 4)
                {
                    won = 1;
                    break;
                }
            }
        }
    }

    return won;
}