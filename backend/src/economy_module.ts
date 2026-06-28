// economy_module.ts
// Altın bakiyesi, karakter unlock/upgrade işlemleri

let allCharactersCache: any[] = [
    {
        id: "char_warrior",
        name: "Warrior",
        base_health: 5000,
        base_damage: 800,
        base_speed: 300,
        base_ulti_power: 2000,
        base_health_regen: 50,
        unlock_type: 'default',
        unlock_cost_gold: 0,
        unlock_cost_iap: '',
        iap_price_display: '',
        costumes: [
            { id: 'default', name: 'Default', iap_product_id: '', price_display: '', thumbnail: 'costume_warrior_default' },
        ]
    },
    {
        id: "char_archer",
        name: "Archer",
        base_health: 3500,
        base_damage: 1200,
        base_speed: 350,
        base_ulti_power: 2500,
        base_health_regen: 30,
        unlock_type: 'gold',
        unlock_cost_gold: 5000,
    },
    {
        id: "char_mage",
        name: "Mage",
        base_health: 3000,
        base_damage: 1500,
        base_speed: 280,
        base_ulti_power: 3500,
        base_health_regen: 40,
        unlock_type: 'iap',
        unlock_cost_gold: 0,
        unlock_cost_iap: 'com.clansonline.character.mage',
        iap_price_display: '$2.99',
    },
];

let calculateStatValue = function(baseValue: number, level: number): number {
    return Math.round(baseValue * Math.pow(1.04, level));
};

let calculateUpgradeCost = function(currentLevel: number): number {
    return currentLevel * 500 + 500;
};