# SignUpScene.gd - Sahne: SignUpScene
# Apple/Google/Email ile giriş-kayıt UI
extends Node

func _ready():
	_create_ui()

func _create_ui():
	var bg = ColorRect.new()
	bg.color = Color(0.05, 0.1, 0.4)
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

func _on_email_sign_in():
	_show_email_dialog()

func _show_email_dialog():
	var dialog = Window.new()
	dialog.title = "Email Sign In"
	dialog.size = Vector2(UIUtil.rw(40), UIUtil.rh(40))
	get_tree().root.add_child(dialog)

func _navigate_to_lobby():
	get_tree().change_scene_to_file("res://scenes/LobbyScene.tscn")
