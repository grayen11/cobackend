# BattleArenaScene.gd - Sahne: BattleArenaScene
# İzometrik savaş alanları - hareket/ateş/ulti kontrolleri
extends Node

var match_id: String = ""
var local_player_id: String = ""
var match_state: Dictionary = {}
var players: Dictionary = {}
var items: Dictionary = {}
var is_initialized: bool = false
var time_remaining: int = 180

func _ready():
	local_player_id = Net.current_user_id
	match_id = Net.reconnect_match_id
	_create_ui()
	_connect_to_match()
	add_to_group("battle_arena")

func _create_ui():
	var viewport_container = SubViewportContainer.new()
	viewport_container.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(viewport_container)

func _connect_to_match():
	if Net.socket and Net.socket.is_connected():
		var join_result = await Net.socket.join_match_async(match_id)
		if not join_result.is_exception():
			print("Joined match: ", match_id)
			is_initialized = true

func _process(delta: float):
	if not is_initialized:
		return
