from telethon import TelegramClient, events, Button
from telethon.tl import types
from bot.webapp_api.api import WebAppApi
from bot.config import read_config



config = read_config()
API_ID = config['TELEGRAM']['API_ID']
API_HASH = config['TELEGRAM']['API_HASH']
BOT_TOKEN = config['TELEGRAM']['BOT_TOKEN']
BASE_URL = config['WEBAPP']['BASE_URL']

webappapi = WebAppApi(BASE_URL)



@events.register(events.NewMessage(pattern='/new_room'))
async def create_new_room(event):
    print('Create new room')
    sender = await event.get_sender()
    print(sender.id)
    room_link = webappapi.new_room(sender.id, 'best_room')
    print(room_link)
    room_link_btn = types.KeyboardButtonWebView("Room", room_link)
    await event.respond("Here's your room link:", buttons=[room_link_btn])


async def start_bot():
    client = TelegramClient('anon', api_id=API_ID, api_hash=API_HASH)
    await client.start(bot_token=BOT_TOKEN)
    print('started')
    for handler in [
        create_new_room]:
        client.add_event_handler(handler)
    await client.disconnected