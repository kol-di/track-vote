from telethon import TelegramClient, events
from telethon.tl import types
from bot.webapp_api.api import WebAppApi, ApiStatus
from bot.config import read_config
from bot.utils.encrypt_utils import EncryptManager
from bot.utils.chat_utils import button_list
import os


# Configuration
config = read_config()
API_ID = config['TELEGRAM']['API_ID']
API_HASH = config['TELEGRAM']['API_HASH']
BOT_TOKEN = config['TELEGRAM']['BOT_TOKEN']
BOT_USERNAME = config['TELEGRAM']['BOT_USERNAME']

BASE_URL = config['WEBAPP']['BASE_URL']         # URL on which telegram mini app is served
WEBAPP_URL = os.getenv('WEBAPP_URL', BASE_URL)  # use docker network, fallback to global URL

# Utility and API initialization
client = TelegramClient('anon', api_id=API_ID, api_hash=API_HASH)
encrypt_manager = EncryptManager()
api = WebAppApi(WEBAPP_URL, jwt_payload=API_ID)

# Callback prefixes
ADMIN_LINK_PREFIX = "adminLink:"
USER_LINK_PREFIX = "userLink:"
GET_ROOM_PREFIX = "getRoom:"


@events.register(events.NewMessage(pattern='/new_room'))
async def create_new_room(event):
    registered_commands = [
        '/new_room', '/my_rooms', '/admin_room_link', '/user_room_link', '/start'] 

    print('Create new room')
    sender = await event.get_sender()

    room_name = None
    async with client.conversation(sender, timeout=60, exclusive=False, replies_are_responses=True) as conv:
        try:
            await conv.send_message("Как вы хотите назвать комнату?")
            room_name = (await conv.get_response()).text
        except TimeoutError:
            room_name = None

    if (room_name is not None) and (room_name not in registered_commands):
        response = await api.new_room(sender.id, room_name)
        if response['status'] == ApiStatus.SUCCESS:
            room_id = response['data']
            room_link = f"{BASE_URL}/rooms/{room_id}"
            room_link_btn = types.KeyboardButtonWebView(room_name, room_link)
            await event.respond("**Войти в комнату:**", buttons=[room_link_btn])
        else:
            await event.respond("Ошибка при создании команты")


@events.register(events.NewMessage(pattern='/my_rooms'))
async def list_user_rooms(event):
    sender = await event.get_sender()
    admin_rooms_response = await api.admin_rooms(sender.id)
    user_rooms_response = await api.user_rooms(sender.id)
    if admin_rooms_response['status'] == ApiStatus.SUCCESS and user_rooms_response['status'] == ApiStatus.SUCCESS:

        admin_buttons = button_list(
            admin_rooms_response['data'], 
            GET_ROOM_PREFIX, 
            name_postfix=' - Админ.')
        
        user_buttons = button_list(
            user_rooms_response['data'], 
            GET_ROOM_PREFIX)

        buttons = admin_buttons + user_buttons
        await event.respond("Доступные комнаты:", buttons=buttons)
    else:
        await event.respond("Ошибка при получении списка комнат")


async def _room_webview(event, data, prefix):
    room_id = data[len(prefix):]

    # check if room in the url is still present
    response_room_exists = await api.room_exists(room_id)
    if response_room_exists['status'] == ApiStatus.SUCCESS:
        if response_room_exists['exists']:
            join_link = f"{BASE_URL}/rooms/{room_id}"
            join_link_btn = types.KeyboardButtonWebView(response_room_exists['name'], join_link)
            await event.respond("Присоединиться к комнате:", buttons=[join_link_btn])

        else:
            await event.reply("Комната больше недоступна")
    else:
        await event.reply("Не удалось найти комнату")


### Generate links ###

async def _generate_join_link(event, data, prefix, response_text):
    try:
        room_id, role = data[len(prefix):].split(':')
        response = await api.room_exists(room_id)
        if response['status'] == ApiStatus.SUCCESS:
            if response['exists']:
                encrypted_data = encrypt_manager.encrypt_data(f"{room_id}:{role}")
                invite_link = f"https://t.me/{BOT_USERNAME}?start={encrypted_data}"
                await event.reply(f"{response_text} [ссылка]({invite_link})")
            else:
                await event.answer("Эта комната больше недоступна", alert=True)
        else:
            await event.answer("Не удалось сгенерировать ссылку-приглашение", alert=True)
    except Exception as e:
        await event.answer(f"Ошибка при генерации ссылки", alert=True)


@events.register(events.CallbackQuery)
async def handle_inline_button_click(event):
    prefix_params = {
        ADMIN_LINK_PREFIX: {"response_text": "Перешли ссылку что бы добавить админов в комнату:"}, 
        USER_LINK_PREFIX: {"response_text": "Перешли ссылку что бы добавить пользователей в комнату:"},
        GET_ROOM_PREFIX: {}
    }

    data = event.data.decode('utf-8')
    for prefix in [ADMIN_LINK_PREFIX, USER_LINK_PREFIX]:
        if data.startswith(prefix):
            await _generate_join_link(event, data, prefix, **prefix_params[prefix])    
    if data.startswith(GET_ROOM_PREFIX):
        await _room_webview(event, data, GET_ROOM_PREFIX, **prefix_params[GET_ROOM_PREFIX])
        



### Prompt link generation ###

async def _room_buttons(event, invite_url_role_param, prefix, respond_msg):
    sender = await event.get_sender()
    response = await api.admin_rooms(sender.id)

    if response['status'] == ApiStatus.ERROR:
        await event.respond(f"Возникла ошибка")
    elif not response['data']:
        await event.respond(f"Нет активных комнат, в которых вы администратор")
    else:

        buttons = button_list(
            response['data'], 
            prefix, 
            role=invite_url_role_param)
        await event.respond(respond_msg, buttons=buttons)


@events.register(events.NewMessage(pattern='/admin_room_link'))
async def send_admin_room_buttons(event):
    await _room_buttons(
        event, 
        invite_url_role_param='a', 
        prefix=ADMIN_LINK_PREFIX,
        respond_msg="Для какой комнаты сгенерировать админскую ссылку?"
    )


@events.register(events.NewMessage(pattern='/user_room_link'))
async def send_user_room_buttons(event):
    await _room_buttons(
        event, 
        invite_url_role_param='u', 
        prefix=USER_LINK_PREFIX,
        respond_msg="Для какой комнаты сгенерировать обычную ссылку?"
    )


### Start ###

@events.register(events.NewMessage(pattern='/start'))
async def start(event):
    sender = await event.get_sender()
    user_id = sender.id

    response_user_exists = await api.user_exists(user_id)
    if response_user_exists['status'] == ApiStatus.SUCCESS:
        # always create new users and greet if successful
        if not response_user_exists['exists']:
            response_create = await api.create_user(user_id)
            if response_create['status'] == ApiStatus.SUCCESS:
                await event.respond("Добро пожаловать в бота! Посмотри список доступных команд и продолжай пользоваться.")
            else:
                await event.reply("Ошибка при создании нового пользователя")
                return
            
        params = event.raw_text.split(maxsplit=1)

        # if entered via invite link launch join link generation
        if len(params) > 1:
            encoded_data = params[1]
            try:
                decrypted_data = encrypt_manager.decrypt_data(encoded_data)
                decrypted_str = decrypted_data.decode('utf-8')
                room_id, role = decrypted_str.split(':')

                # check if room in the url is still present
                response_room_exists = await api.room_exists(room_id)
                if response_room_exists['status'] == ApiStatus.SUCCESS:
                    if response_room_exists['exists']:

                        # Add the user to the room based on the role
                        response_add = await api.add_user_to_room(room_id, user_id, role)
                        if response_add['status'] == ApiStatus.SUCCESS:
                            join_link = f"{BASE_URL}/rooms/{room_id}"
                            join_link_btn = types.KeyboardButtonWebView(response_room_exists['name'], join_link)
                            await event.respond("Присоединиться к комнате:", buttons=[join_link_btn])
                        else:
                            await event.reply("Не удалось добавить тебя в комнату")
                    else:
                        await event.reply("Комната больше недоступна")
                else:
                    await event.reply("Не удалось найти комнату")
            except Exception as e:
                await event.reply(f"Ссылка содержит неверные данные")

        # not via invite link and not new user
        elif response_user_exists['exists']:
            await event.reply("Бот уже запущен. Используй доступные команды для продолжения работы.")
    else:
        await event.reply("Ошибка при проверке существования пользователя")


### Execution ###

async def start_bot():
    await client.start(bot_token=BOT_TOKEN)
    print('Telegram client started')
    await api.start_session()
    print('Client session started')

    for handler in [
        start,
        create_new_room,
        list_user_rooms,
        send_admin_room_buttons,
        send_user_room_buttons,
        handle_inline_button_click
    ]:
        client.add_event_handler(handler)

    await client.run_until_disconnected()

async def exit_bot():
    await client.disconnect()
    await api.close_session()
        
