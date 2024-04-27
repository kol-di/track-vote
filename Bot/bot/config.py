import configparser


def read_config():
    config = configparser.ConfigParser()
    config.read('conf.ini')
    return config