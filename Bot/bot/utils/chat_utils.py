from telethon import Button


def button_list(data, callback_prefix, buttons_in_row=2, name_prefix='', name_postfix='', role=''):
    buttons = [
        Button.inline(
            name_prefix + room['name'] + name_postfix,
            data=f"{callback_prefix}{room['id']}{':'+role if role else ''}"
        ) for room in data]
    
    buttons = [
        buttons[i*buttons_in_row:(i+1)*buttons_in_row] 
        for i in range(len(buttons) // 2 + 1)]
    
    return buttons
