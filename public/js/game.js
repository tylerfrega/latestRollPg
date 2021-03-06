$(document).ready(function(){
createPlayer();
setCharacterInfo();
$("#rollDice").on('click', rollDice);
$(document).on('click', '#combatRoll', function(){attack(enemy)});
$('#checkRoll').on('click', CheckRoll);
});

var enemy;
var OriginalHP;
var NewHP;
var characterFromLocalStorage = JSON.parse(localStorage.getItem('selectedCharacter'));
var player;
var displayRollArr = [];
var rollTotalDisplay;
var rollResult;
var socket = io();

socket.on('newEnemy', function(data){
    setEnemyInfo(data);
     enemy = data;
          
});
socket.on('enemyDamage', function(data){
    setEnemyInfo(data);
     enemy = data;
          
});
socket.on('playerDamage', function(data){
    if(data.name === player.characterName){
        checkIfPlayerIsAlive(data);
        updatePlayerHp(data);
        player.hp = data.hp;
        $('#playerHp').html(`HP: ${player.hp}`);
        updateHPbar(player);

        $("#health").html(`Health Points: ${player.hp}`);

    }else{console.log('enemy attack failed')}
    
});

function rollDice(){
    $('#diceHolder').css("display:inline");
    $('#diceTotal').empty();
    $('#diceOutcome').empty();
    $('#diceTotal2').empty();
    $('#diceOutcome2').empty();
    $("#checkModal").css("display","none");
    $("#combatModal").css("display","none");
}


///this function executes the necessary code to preform and display the results from our player.combat roll function
function attack(enemy){
    console.log(enemy)
    player.combatRoll(enemy);
    displayCombatRoll();
    sendEnemyInfo(enemy);
    setEnemyInfo(enemy);
    
}

function sendEnemyInfo(enemy){
    socket.emit('enemyDamage', enemy)
    socket.on('enemyDamage', function(data){
        console.log('enemy damage sent')
    }) 
}


//this funcion displays the results of the users dice rolls. 
//for now, we store the the results of the dice rolls from the player.combatRoll and player.check roll as global variables 
//so they can be accessed by other functions
function displayCombatRoll() {
    $('#combatModal').css( "display", "inline" );
    $('#checkModal').css( "display", "none" );
    $(".dieIcon").css("display","none");
    $(".rollAnimation").attr("src", "");
    $(".rollAnimation").css("display","inline");
    $(".rollAnimation").attr("src", "/img/dice/rollAnimation.gif");
    setTimeout(function() {
        $(".dieIcon").css("display","none");
        var rollnumber1 = displayRollArr[0];
        var rollnumber2 = displayRollArr[1];
        var rollnumber3 = displayRollArr[2];
        console.log("1:" + rollnumber1);
        console.log("2:" + rollnumber2);
        console.log("3:" + rollnumber3);
        $('#diceNumbers').html("You rolled " + rollnumber1 + ", " + rollnumber2 + " and " + rollnumber3);
        $('#diceTotal').html(`Total = ${rollTotalDisplay}`);
        $('#diceOutcome').html(`${rollResult}`);
        $(".dice1[data-value='" + rollnumber1 + "']").css("display","inline");
        $(".dice2[data-value='" + rollnumber2 + "']").css("display","inline");
        $(".dice3[data-value='" + rollnumber3 + "']").css("display","inline");
            displayRollArr = []; 
    }, 2500);
}

function CheckRoll() {
    $('#checkModal').css( "display", "inline" );
    $('#combatModal').css( "display", "none" );
    $(".dieIcon").css("display","none");
    $(".rollAnimation").attr("src", "");
    $(".rollAnimation").css("display","inline");
    $(".rollAnimation").attr("src", "/img/dice/rollAnimation.gif");
    setTimeout(function() {
        player.checkRoll();
        var checkrollnumber = displayRollArr[0];
        $(".dieIcon").css("display","none");
        $('#diceTotal2').html("You rolled " + checkrollnumber);
        $('#diceOutcome2').html(`${rollResult}`);
        $("img[data-value='" + checkrollnumber + "']").css("display","inline");
            displayRollArr = []; 
    }, 2500);
    
}

//this creates a new instance of our constructor function and assigns the object the variable name "player"
//we will use the player variable name to preform attack and check functions on the game page
function createPlayer(){
    var selectedCharacter = characterFromLocalStorage;
    
    sessionCharacter = new Character(selectedCharacter.characterName, 
                                         selectedCharacter.class,
                                         selectedCharacter.hp,
                                         selectedCharacter.ap,
                                         selectedCharacter.de,
                                         selectedCharacter.alive,
                                         selectedCharacter.weapon,
                                         selectedCharacter.lore
                                        );
    player = sessionCharacter;
   
    socket.emit('newPlayer', {
        name:player.characterName,
        hp: player.hp,
        ap: player.ap,
        de: player.de,
        alive: player.alive,
        weapon: player.weapon,
        lore: player.lore,
                        
    });
    socket.on('newPlayer', function(data){
        console.log(data);
    });
}

//this function displays our characters stats. hp, ap, de, class and weapon name
function setCharacterInfo(){
    $('#enemyInfoDisplay').hide();
    $('#enemyText').hide();
    $('#name').html(player.characterName);
    $('#health').html("HP: " + player.hp);
    $('#attackVal').html(`Your Attack Value is ${player.ap}`);
    $('#lore').html(player.lore);
    $("#health").html(`Health Points: ${player.hp}`);
    $('#characterInfoDisplay').prepend(`<li class= "characterAttributes" id="ap"> Ap: ${player.ap}</li>
                                       <li class= "characterAttributes" id="de"> De: ${player.de}</li>
                                       <li class= "characterAttributes"> <strong>Class:</strong> ${player.characterClass}</li>
                                       <li class= "characterAttributes"> <strong>Weapon:</strong> ${player.weapon}</li>
                                       `);
setImages();
updateHPbar(player);

}

function checkIfPlayerIsAlive(player){
    console.log('alive')
    if(player.hp <= 0){
        $('#characterInfoDisplay').hide();
        $('#name').html(`${player.name} Has Fallen!`);
        $('#combatRoll').hide();
        $('#checkRoll').hide();
        $('#lore').hide();
        $('#rollDice').hide();
        killPlayer(player);
    }else{
        return
    }
}

function updatePlayerHp(player){
    $.ajax({
        method: "put",
        url: "api/updateHp",
        data: {
                characterName: player.name, 
                hp: player.hp
                },
        success: console.log('hp updated')
    });
}



function killPlayer(player){
    $.ajax({
        method: "delete",
        url: "api/killPlayer",
        data: {
                characterName: player.name, 
                },
        success: console.log('hp updated')
    });
}


//this function displays the current enemy stats
function setEnemyInfo(enemy){
    if(enemy.hp <= 0){
        enemy.alive === false
        $('#enemyDeath').show();
        $('#enemyDeath').html(`${enemy.name} has fallen.`);
        $('#enemyInfoDisplay').hide();
        $('#enemyText').hide();
        enemy = '';
        levelUp(player);
        

    }else{

    $('#enemyInfoDisplay').show();
    $('#enemyText').show();
    $('#enemyInfoDisplay').html(`<li class= enemyAttributes> Hp: ${enemy.hp}</li>
                                     <li class= enemyAttributes> Ap: ${enemy.ap}</li>
                                     <li class= enemyAttributes> De: ${enemy.de}</li>
                                     <li class= enemyAttributes> Weapon: ${enemy.weapon}</li>`);
    }
    $("#enemyInfoDisplay").prepend(`<h3 id="enemyName"> ${enemy.name}</h3>`);
    
}

//our constructor function. This takes the info from the selected character (stored in local memory on the getCharacterInfo.js page)
//and creates a new object with attack and check methods attached
function Character(characterName, characterClass, hp, ap, de, alive, weapon, lore) {
    this.characterName = characterName;
    this.characterClass = characterClass;
    this.hp = hp;
    this.ap = ap;
    this.de = de;
    this.alive = true;
    this.weapon = weapon;
    this.lore = lore;
    this.combatRoll = function(enemy){
        var roll1 = Math.floor((Math.random() * 10) + 1);
        var roll2 = Math.floor((Math.random() * 10) + 1);
        var roll3 = Math.floor((Math.random() * 10) + 1);
        var rollTotal = roll1 + roll2 + roll3;
        var result;
    
        if(rollTotal < 4){
            result = 'Critical Fail';
            this.hp -= rollTotal + this.ap;
        }
        else if(rollTotal >= 4 && rollTotal < 15){
            result = 'Fail';
        }
        else if(rollTotal >=15 && rollTotal <27){
            result = 'Success';
            enemy.hp -= rollTotal + this.ap - enemy.de;
        }
        else if(rollTotal >= 27){
            result = 'Critical Success';
            enemy.hp -= rollTotal + rollTotal + this.ap;
        }
        displayRollArr.push(roll1);
        displayRollArr.push(roll2);
        displayRollArr.push(roll3);
        rollResult = result;
        rollTotalDisplay = rollTotal;
        
        console.log(enemy.de)
        console.log(enemy)    
    };
    this.checkRoll = function(){
        roll = Math.floor(Math.random() * 10) + 1;
        
        if(roll >=5) {
            displayRollArr = [];
            displayRollArr.push(roll);
            rollResult = 'Success';        
        }
        else if(roll < 5) {
            displayRollArr = [];
            displayRollArr.push(roll);
            rollResult = 'Fail';        
        }
    }
    
}

function updateHPbar(player){
    switch(player.characterClass){
        case 'Archer':
            var OriginalHP = 125;
            var NewHP = player.hp;
            var barHP = Math.round((NewHP / OriginalHP)*100);
            $('.bar').attr('style', 'width:' + barHP + '%');
            break;
            
        case 'Mage':
            var OriginalHP = 100;
            var NewHP = player.hp;
            var barHP = Math.round((NewHP / OriginalHP)*100);
            $('.bar').attr('style', 'width:' + barHP + '%');
            break;
        
        case 'Warrior':
            var OriginalHP = 150;
            var NewHP = player.hp;
            var barHP = Math.round((NewHP / OriginalHP)*100);
            $('.bar').attr('style', 'width:' + barHP + '%');
            break;
    }
}


function setImages(){
    switch(player.characterClass){
        case 'Archer':
            $('#characterImg').attr('src', '/img/characters/archer.png');
            break;
            
        case 'Mage':
            $('#characterImg').attr('src', '/img/characters/mage.png');
            break;
        
        case 'Warrior':
            $('#characterImg').attr('src', '/img/characters/warrior.png');
            break;
    }
    

    if(player.weapon === "Longbow"){
        $('#weaponImg').attr('src', '/img/w-archerBOW&A.png');
    }else if(player.weapon === "Crossbow"){
        $('#weaponImg').attr('src', '/img/w-archerCROSSB.png');
    }else if(player.weapon === "Sword and Sheild"){
        $('#weaponImg').attr('src', '/img/w-warriorSW&SH.png');
    }else if(player.weapon === "Dagger"){
        $('#weaponImg').attr('src', '/img/w-mageDAGGER.png');
    }else if(player.weapon === "Shortsword"){
        $('#weaponImg').attr('src', '/img/w-archerSHORTSW.png');
    }else if(player.weapon === "Staff"){
        $('#weaponImg').attr('src', '/img/w-mageSTAFF.png');
    }else if(player.weapon === "Wand"){
        $('#weaponImg').attr('src', '/img/w-mageWAND.png');
    }else if(player.weapon === "Axe"){
        $('#weaponImg').attr('src', '/img/w-warriorAxe.png');
    }else if(player.weapon === "Mace"){
        $('#weaponImg').attr('src', '/img/w-warriorMace.png');
    }else if(player.weapon === "Sword and Sheild"){
        $('#weaponImg').attr('src', '/img/w-warriorSW&S.png');
    }
   

}