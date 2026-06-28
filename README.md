# Clans Online - Complete Game Modules

## Backend (TypeScript - Nakama)

### Core Modules
- **main.ts** - InitModule ile tüm RPC ve hook kayıtları
- **account_module.ts** - Apple/Google/Email authentication
- **economy_module.ts** - Altın sistemi ve karakter upgrade
- **iap_module.ts** - RevenueCat IAP webhook işleme
- **matchmaker_module.ts** - Oyuncu eşleştirme ve bot doldurma
- **battle_match_handler.ts** - Savaş state machine ve oyun mekanikleri
- **clan_module.ts** - Nakama Groups API ile klan sistemi
- **anticheat_module.ts** - Oyuncu raporlama ve anti-hile
- **ad_config_rpc.ts** - Reklam alanı konfigürasyonu
- **version_check_rpc.ts** - İstemci versiyon kontrolü

## Client (GDScript - Godot 4)

### Autoload Singletons
- **Net.gd** - Nakama bağlantısı ve RPC sarmalayıcıları
- **UIUtil.gd** - Responsive UI, safe area hesaplama
- **Audio.gd** - Müzik, SFX ve titreşim yönetimi
- **Locale.gd** - 50+ dil desteği

### Scenes
- **LoadingScene.gd** - Açılış yükleme ekranı
- **SignUpScene.gd** - Kimlik doğrulama UI
- **LobbyScene.gd** - Ana lobi, karakter seçimi
- **MapSelectScene.gd** - Harita seçimi
- **CharacterUpgradeScene.gd** - Stat yükseltme
- **SettingsScene.gd** - Ses, dil, hesap ayarları
- **ProfileScene.gd** - Kullanıcı profili
- **ClanScene.gd** - Klan yönetimi
- **BattleLoadingScene.gd** - Savaş yükleme
- **BattleArenaScene.gd** - İzometrik savaş alanı
- **ResultsScene.gd** - Maç sonu sonuçları

## Deployment

### Backend Setup
```bash
cd backend
npm install
npm run build
```

### Database
- PostgreSQL 13+
- Nakama 3.0+

### Docker Compose
```yaml
version: '3'
services:
  nakama:
    image: heroiclabs/nakama:3.18.0
    environment:
      - NAKAMA_DATABASE_URL=postgresql://...
```

## Features

✅ Multi-platform authentication (Apple, Google, Email)
✅ Economy system with character upgrades
✅ IAP integration with RevenueCat
✅ Real-time multiplayer battles
✅ Clan/group system
✅ Matchmaking with bot fill
✅ Anti-cheat reporting
✅ Ad configuration system
✅ Version control
✅ Multi-language support (50+ languages)

## License

MIT License
