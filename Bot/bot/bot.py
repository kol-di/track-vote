from telethon import TelegramClient, events, Button
from telethon.tl import types
from bot.webapp_api.api import WebAppApi
from bot.config import read_config



config = read_config()
API_ID = config['TELEGRAM']['API_ID']
API_HASH = config['TELEGRAM']['API_HASH']
BOT_TOKEN = config['TELEGRAM']['BOT_TOKEN']
BASE_URL = config['WEBAPP']['BASE_URL']
HOST_TUNNEL = config['WEBAPP']['HOST_TUNNEL']

webappapi = WebAppApi(BASE_URL)



@events.register(events.NewMessage(pattern='/start'))
async def show_app_link(event):
    print('respond')
    app_button = types.KeyboardButtonWebView("WebApp", HOST_TUNNEL)
    await event.respond("Here's your button", buttons=[app_button])


@events.register(events.NewMessage(pattern='/new_room'))
async def create_new_room(event):
    print('Create new room')
    sender = await event.get_sender()
    print(sender.id)
    webappapi.new_room(sender.id, 'best_room')


async def start_bot():
    client = TelegramClient('anon', api_id=API_ID, api_hash=API_HASH)
    await client.start(bot_token=BOT_TOKEN)
    print('started')
    for handler in [
        show_app_link, 
        create_new_room]:
        client.add_event_handler(handler)
    await client.disconnected