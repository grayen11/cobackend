# Net.gd - Autoload Singleton
# Nakama client bağlantısı, socket yönetimi, RPC çağrı sarmalayıcıları
extends Node

const NAKAMA_HOST = "127.0.0.1"
const NAKAMA_PORT = 7350
const SERVER_KEY = "defaultkey"
const SSL_ENABLED = false

var client: NakamaClient
var session: NakamaSession
var socket: NakamaSocket

var current_user_id: String = ""
var current_username: String = ""
var selected_character_id: String = "char_warrior"
var selected_map_id: String = "random"
var current_gold: int = 0
var is_connected: bool = false

func _ready():
	_setup_nakama()
	_load_saved_session()

func _setup_nakama():
	client = Nakama.create_client(NAKAMA_HOST, NAKAMA_PORT, SERVER_KEY, SSL_ENABLED)

func _load_saved_session():
	var saved_token = _read_local_data("auth_token")
	if saved_token:
		session = NakamaSession.new()
		session.token = saved_token
		current_user_id = _read_local_data("user_id")
		current_username = _read_local_data("username")
		await _connect_socket()
		is_connected = true

func _connect_socket() -> bool:
	if socket and socket.is_connected():
		return true
	
	socket = Nakama.create_socket_from(client, session)
	socket.connected.connect(_on_socket_connected)
	socket.closed.connect(_on_socket_closed)
	
	var connected = await socket.connect_async(session)
	if connected:
		print("Socket connected")
		return true
	return false

func _on_socket_connected():
	is_connected = true
	print("WebSocket connected")

func _on_socket_closed():
	is_connected = false
	print("WebSocket closed")

func rpc_async(func_name: String, payload: Dictionary = {}) -> Dictionary:
	var json_payload = JSON.stringify(payload)
	var result = await client.rpc_async(session, func_name, json_payload)
	if result.is_exception():
		print("RPC Error (%s): %s" % [func_name, result.get_exception().message])
		return {"success": false, "error": result.get_exception().message}
	return JSON.parse_string(result.payload) if result.payload else {"success": false}

func authenticate_email(email: String, password: String, create: bool = false) -> Dictionary:
	var result
	if create:
		result = await client.authenticate_email_async(session, email, password, "", true)
	else:
		result = await client.authenticate_email_async(session, email, password, "", false)
	
	if result.is_exception():
		return {"success": false, "error": result.get_exception().message}
	session = result
	_save_session()
	await _connect_socket()
	return {"success": true}

func _save_session():
	if session:
		_write_local_data("auth_token", session.token)
		_write_local_data("user_id", session.user_id)
		_write_local_data("username", session.username)
		current_user_id = session.user_id
		current_username = session.username

func _read_local_data(key: String, default: String = "") -> String:
	var file = FileAccess.open("user://clans_online.cfg", FileAccess.READ)
	if file:
		var content = file.get_as_text()
		file.close()
		var config = ConfigFile.new()
		config.parse(content)
		return config.get_value("session", key, default)
	return default

func _write_local_data(key: String, value: String):
	var config = ConfigFile.new()
	config.load("user://clans_online.cfg")
	config.set_value("session", key, value)
	config.save("user://clans_online.cfg")

func logout():
	_write_local_data("auth_token", "")
	current_user_id = ""
	current_username = ""
	if socket:
		socket.close()
	is_connected = false
