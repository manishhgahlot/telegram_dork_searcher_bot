/* coded by manish gahlot
join telegram channel for more coodes - https://t.me/Asurccworld */


const TelegramBot = require('node-telegram-bot-api');
const googleIt = require('google-it');
const fs = require('fs');
const axios = require('axios');

const token = '6088593943:AAGBi2SIhvhqvSH_FQwc6Oy6-BKOha99Ehk';
const bot = new TelegramBot(token, { polling: true });
const defaultLimit = 10000; // Default limit if no limit provided
const usersFile = 'allowed_users.txt'; // File to store allowed user IDs
const groupsFile = 'allowed_groups.txt';
const masterId = 916264684; // Master user ID

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const response = `Welcome to the bot! \nYou can use the following commands: \n/me - To get your user details \n/search query  - To perform a Google search `;

  bot.sendMessage(chatId, response);
});



// me
// ID command
bot.onText(/\/me/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username ? msg.from.username : 'No username';
  const firstName = msg.from.first_name ? msg.from.first_name : 'No first name';
  const lastName = msg.from.last_name ? msg.from.last_name : 'No last name';
  const languageCode = msg.from.language_code ? msg.from.language_code : 'No language code';
  const response = `User Details:\nID: ${userId}\nUsername: ${username}\nFirst Name: ${firstName}\nLast Name: ${lastName}\nLanguage Code: ${languageCode}`;

  bot.sendMessage(chatId, response);
});




//add group 
bot.onText(/\/addgroup (-\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const groupId = match[1]; // the captured "groupId"

  // Check if message is from master user
  if (msg.from.id !== masterId) {
    bot.sendMessage(chatId, "Sorry, you're not allowed to use this command.");
    return;
  }

  // Read allowed groups from file
  const allowedGroups = fs.readFileSync(groupsFile, 'utf8').split('\n').filter(Boolean);

  // Check if group is already allowed
  if (allowedGroups.includes(groupId)) {
    bot.sendMessage(masterId, `Group ${groupId} is already allowed.`);
    return;
  }

  fs.appendFileSync(groupsFile, groupId + '\n');
  bot.sendMessage(chatId, `Group ${groupId} has been added.`);
});




// Add user command
bot.onText(/\/adduser (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = parseInt(match[1]); // the captured "userId"

  // Check if message is from master user
  if (msg.from.id !== masterId) {
    bot.sendMessage(chatId, "Sorry, you're not allowed to use this command.");
    return;
  }

  // Read allowed users from file
  const allowedUsers = fs.readFileSync(usersFile, 'utf8').split('\n').map(Number).filter(Boolean);

  // Check if user is already allowed
  if (allowedUsers.includes(userId)) {
    bot.sendMessage(masterId, `User ${userId} is already allowed.`);
    return;
  }

  fs.appendFileSync(usersFile, userId + '\n');
  bot.sendMessage(chatId, `User ${userId} has been added.`);
});
// Remove user command
bot.onText(/\/removeuser (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = parseInt(match[1]); // the captured "userId"

  // Check if message is from master user
  if (msg.from.id !== masterId) {
    bot.sendMessage(chatId, "Sorry, you're not allowed to use this command.");
    return;
  }

  // Read allowed users from file
  let allowedUsers = fs.readFileSync(usersFile, 'utf8').split('\n').map(Number).filter(Boolean);

  // Remove user from array
  allowedUsers = allowedUsers.filter(id => id !== userId);

  // Write remaining users back to file
  fs.writeFileSync(usersFile, allowedUsers.join('\n') + '\n');
  bot.sendMessage(chatId, `User ${userId} has been removed.`);
});





// Search command
bot.onText(/\/search (.+)(?: (\d+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Read allowed users and groups from files
  const allowedUsers = fs.readFileSync(usersFile, 'utf8').split('\n').map(Number).filter(Boolean);
  const allowedGroups = fs.readFileSync(groupsFile, 'utf8').split('\n').filter(Boolean);

  // Check if user is allowed or the chat is an allowed group
  if (!allowedUsers.includes(userId) && !allowedGroups.includes(String(chatId))) {
    bot.sendMessage(chatId, "Sorry, you're not allowed to use this bot.");
    return;
  }

  const query = match[1]; // the captured "query"
  const limit = match[2] ? Math.min(parseInt(match[2]), 100) : defaultLimit; // the captured "limit", not exceeding 100

  // Check if query is empty
  if (!query) {
    bot.sendMessage(chatId, "Please provide a search query.");
    return;
  }


  bot.sendMessage(chatId, "Loading... Please wait.")
    .then(loadingMsg => {
      googleIt({ 'query': query, 'limit': limit }).then(results => {
        var data = '';
        results.slice(0, limit).forEach(result => {
          data += result.link + '\n';
        });
        fs.writeFileSync('search_results.txt', data);
        bot.sendDocument(chatId, './search_results.txt').then(() => {
          bot.deleteMessage(chatId, loadingMsg.message_id);
          bot.sendMessage(masterId, `Search results for "${query}" have been sent to ${chatId}`);
        });
      }).catch(e => {
        console.error(e);
      });
    })
});