const fs = require('fs')
const path = require('path')
const root = path.join(__dirname, '..')

// ══════════════════════════════════════════════════════
// DADOS BASE
// ══════════════════════════════════════════════════════

const MATERIALS = {
  1:  ['bone_fragment','reptile_skin','raw_qi_core','raw_iron'],
  2:  ['beast_scale','distilled_venom','qi_crystal','refinement_dust'],
  3:  ['spiritual_feather','beast_claw','spiritual_essence','pure_qi_silk'],
  4:  ['mystic_scale','demon_bone','mystic_crystal','mystic_qi_elixir'],
  5:  ['core_fragment','phoenix_feather','core_essence','transmutation_dust'],
  6:  ['soul_fragment','soul_crystal','soul_essence','sacred_qi_ink'],
  7:  ['king_scale','king_blood','king_core','royal_elixir'],
  8:  ['imperial_fragment','imperial_crystal','imperial_essence','transcendence_dust'],
  9:  ['sacred_feather','divine_beast_bone','sacred_essence','holy_elixir'],
  10: ['dao_fragment','creation_crystal','dao_essence','primordial_chaos_dust'],
}

const TIER_STATS = {
  1:  {hp:[60,130],   atk:[5,11],    def:[0,2],   speed:[2.0,2.6], qi:[5,20],       gMin:5,    gMax:20,    lvMin:1,  lvMax:5},
  2:  {hp:[130,270],  atk:[10,22],   def:[1,4],   speed:[1.9,2.5], qi:[15,60],      gMin:15,   gMax:55,    lvMin:5,  lvMax:10},
  3:  {hp:[280,580],  atk:[18,38],   def:[2,7],   speed:[1.8,2.4], qi:[50,200],     gMin:45,   gMax:180,   lvMin:10, lvMax:15},
  4:  {hp:[600,1250], atk:[32,68],   def:[4,12],  speed:[1.7,2.3], qi:[180,720],    gMin:150,  gMax:600,   lvMin:15, lvMax:20},
  5:  {hp:[1300,2700],atk:[55,115],  def:[7,20],  speed:[1.7,2.2], qi:[600,2500],   gMin:500,  gMax:2000,  lvMin:20, lvMax:25},
  6:  {hp:[2800,5800],atk:[95,200],  def:[12,35], speed:[1.6,2.1], qi:[2000,8000],  gMin:1600, gMax:6500,  lvMin:25, lvMax:30},
  7:  {hp:[6000,12500],atk:[160,340],def:[20,60], speed:[1.6,2.1], qi:[7000,28000], gMin:5500, gMax:22000, lvMin:30, lvMax:35},
  8:  {hp:[13000,27000],atk:[270,560],def:[35,100],speed:[1.5,2.0],qi:[25000,100000],gMin:18000,gMax:72000,lvMin:35,lvMax:40},
  9:  {hp:[28000,58000],atk:[450,940],def:[60,170],speed:[1.5,2.0],qi:[90000,360000],gMin:60000,gMax:240000,lvMin:40,lvMax:45},
  10: {hp:[60000,125000],atk:[750,1550],def:[100,280],speed:[1.5,2.0],qi:[320000,1300000],gMin:200000,gMax:800000,lvMin:45,lvMax:50},
}

function between(arr) { return arr[0] + Math.floor(Math.random() * (arr[1] - arr[0] + 1)) }

const FORGE_TYPES = ['faixas','espada','sabre','lanca','leque','manto','coura','armadura',
  'bastao','arco','punhal','martelo','corrente','vestes_espirituais','roupa_sombras',
  'vestes_bestas','orbe','bracadeira','mascara','manopla','grilhao',
  'ring_spatial','ring_offense','accessory_necklace','accessory_bracelet']

function forgeRecipes(tier) {
  if (tier < 2) return []
  // Check which recipes actually exist
  const items = JSON.parse(fs.readFileSync(path.join(root,'data-import/receitas_items.json'),'utf8'))
  const validIds = new Set(items.map(i=>i.id))
  return FORGE_TYPES.map(t=>`receita_forge_${t}_t${tier}`).filter(id=>validIds.has(id))
}

function alchRecipes(tier) {
  if (tier < 2) return []
  return [`alchemy_pill_buff_atk_t${tier}`,`alchemy_pill_buff_def_t${tier}`,
    `alchemy_pill_buff_hp_t${tier}`,`alchemy_pill_buff_crit_t${tier}`,
    `alchemy_pill_meditation_t${tier}`].map(r=>`receita_${r}`)
}

// ══════════════════════════════════════════════════════
// DEFINIÇÃO DO MUNDO
// ══════════════════════════════════════════════════════

const WORLD = [
// T1 — Vila do Despertar
{location:'vila_despertar', tier:1, biomes:[
  {id:'planicie_despertar', name:'Planície do Despertar',
   desc:'Vastas planícies nos arredores da vila. Bestas fracas para iniciantes do cultivo.',
   color:'linear-gradient(135deg,#1a2e1a 0%,#2d4a2d 100%)', accent:'#4a9e4a',
   mapX:165, mapY:812,
   monsters:[
    {id:'lobo_cinzento',    name:'Lobo Cinzento',     emoji:'🐺',r:'common'},
    {id:'javali_jovem',     name:'Javali Jovem',      emoji:'🐗',r:'common'},
    {id:'raposa_veloz',     name:'Raposa Veloz',      emoji:'🦊',r:'common'},
    {id:'cobra_grama',      name:'Cobra da Grama',    emoji:'🐍',r:'common'},
    {id:'rato_planicie',    name:'Rato da Planície',  emoji:'🐀',r:'common'},
    {id:'caranguejo_lama',  name:'Caranguejo da Lama',emoji:'🦀',r:'common'},
    {id:'aranha_negra_p',   name:'Aranha Negra',      emoji:'🕷️',r:'common'},
    {id:'texugo_bravo',     name:'Texugo Bravo',      emoji:'🦡',r:'common'},
    {id:'corvo_comum',      name:'Corvo Comum',       emoji:'🐦',r:'common'},
    {id:'lagarto_pedra',    name:'Lagarto de Pedra',  emoji:'🦎',r:'common'},
   ],
   elite:{id:'elite_urso_planicie',   name:'Urso da Planície',     emoji:'🐻',r:'uncommon'},
   boss: {id:'boss_javali_ancestra',  name:'Javali Ancestral',     emoji:'🐗',r:'uncommon'},
  },
  {id:'floresta_primordial', name:'Floresta Primordial',
   desc:'Densa floresta repleta de Qi natural. O primeiro grande desafio para jovens cultivadores.',
   color:'linear-gradient(135deg,#0d2010 0%,#1a3518 100%)', accent:'#2e7d32',
   mapX:195, mapY:1000,
   monsters:[
    {id:'lobo_sombra_fp',   name:'Lobo das Sombras',  emoji:'🐺',r:'common'},
    {id:'urso_jovem_fp',    name:'Urso Jovem',        emoji:'🐻',r:'common'},
    {id:'serpente_verde',   name:'Serpente Verde',    emoji:'🐍',r:'common'},
    {id:'corvo_floresta',   name:'Corvo da Floresta', emoji:'🐦',r:'common'},
    {id:'raposa_2caudas',   name:'Raposa de Duas Caudas',emoji:'🦊',r:'common'},
    {id:'lesma_venenosa',   name:'Lesma Venenosa',    emoji:'🐌',r:'common'},
    {id:'vespa_floresta',   name:'Vespa da Floresta', emoji:'🐝',r:'common'},
    {id:'peixe_fantasma',   name:'Peixe Fantasma',    emoji:'🐟',r:'common'},
    {id:'cervo_qi',         name:'Cervo de Qi',       emoji:'🦌',r:'common'},
    {id:'fungo_esporos',    name:'Fungo de Esporos',  emoji:'🍄',r:'common'},
   ],
   elite:{id:'elite_serpente_ancia',  name:'Serpente Anciã',       emoji:'🐍',r:'uncommon'},
   boss: {id:'boss_urso_primordial',  name:'Urso Primordial',      emoji:'🐻',r:'uncommon'},
  },
]},

// T2 — Cidade do Jade
{location:'cidade_jade', tier:2, biomes:[
  {id:'jardim_jade', name:'Jardim de Jade',
   desc:'Jardins místicos repletos de Qi espiritual. Felinos de jade e serpentes de escamas patrulham o território.',
   color:'linear-gradient(135deg,#0d1a18 0%,#1a2d28 100%)', accent:'#4a9e7f',
   mapX:490, mapY:521,
   monsters:[
    {id:'tigre_jade',       name:'Tigre de Jade',     emoji:'🐯',r:'common'},
    {id:'leopardo_veloz',   name:'Leopardo Veloz',    emoji:'🐆',r:'common'},
    {id:'cobra_escama',     name:'Cobra de Escama',   emoji:'🐍',r:'common'},
    {id:'escorpiao_jade',   name:'Escorpião de Jade', emoji:'🦂',r:'common'},
    {id:'aguia_espiritual', name:'Águia Espiritual',  emoji:'🦅',r:'uncommon'},
    {id:'pantera_rapida',   name:'Pantera Rápida',    emoji:'🐆',r:'common'},
    {id:'sapo_qi_jade',     name:'Sapo de Qi',        emoji:'🐸',r:'common'},
    {id:'pombajad',         name:'Pomba de Jade',     emoji:'🕊️',r:'common'},
    {id:'lagarto_cristal',  name:'Lagarto Cristal',   emoji:'🦎',r:'common'},
    {id:'vespa_jade',       name:'Vespa de Jade',     emoji:'🐝',r:'uncommon'},
   ],
   elite:{id:'elite_tigre_jade',      name:'Tigre Mestre de Jade', emoji:'🐯',r:'uncommon'},
   boss: {id:'boss_leopardo_jade',    name:'Leopardo Ancestral',   emoji:'🐆',r:'rare'},
  },
  {id:'pantano_jade', name:'Pântano do Jade',
   desc:'Terras pantanosas às margens da cidade. Qi venenoso e materiais valiosos convivem nas profundezas.',
   color:'linear-gradient(135deg,#0a1a0a 0%,#152815 100%)', accent:'#2d6a2d',
   mapX:490, mapY:812,
   monsters:[
    {id:'crocodilo_menor',  name:'Crocodilo Menor',   emoji:'🐊',r:'common'},
    {id:'sapo_gigante',     name:'Sapo Gigante',      emoji:'🐸',r:'common'},
    {id:'vibora_pantano',   name:'Víbora do Pântano', emoji:'🐍',r:'common'},
    {id:'libelula_qi',      name:'Libélula de Qi',    emoji:'🦗',r:'common'},
    {id:'cobra_royal',      name:'Cobra Real',        emoji:'🐍',r:'uncommon'},
    {id:'besouro_pantano',  name:'Besouro do Pântano',emoji:'🪲',r:'common'},
    {id:'tartaruga_lama',   name:'Tartaruga da Lama', emoji:'🐢',r:'common'},
    {id:'piranha_qi',       name:'Piranha de Qi',     emoji:'🐟',r:'common'},
    {id:'polvinho_agua',    name:'Polvo d\'Água',     emoji:'🐙',r:'common'},
    {id:'caranguejo_jade',  name:'Caranguejo de Jade',emoji:'🦀',r:'common'},
   ],
   elite:{id:'elite_croco_jade',      name:'Crocodilo Jade Ancião',emoji:'🐊',r:'uncommon'},
   boss: {id:'boss_hidra_pantano',    name:'Hidra do Pântano',     emoji:'🐉',r:'rare'},
  },
  {id:'ruinas_antigas', name:'Ruínas Antigas',
   desc:'Restos de uma antiga cidade cultivadora. Guardiões e espíritos protegem os segredos enterrados.',
   color:'linear-gradient(135deg,#1a1a0d 0%,#2e2e1a 100%)', accent:'#a0905c',
   mapX:745, mapY:502,
   monsters:[
    {id:'guerreiro_osseo',  name:'Guerreiro Ósseo',  emoji:'💀',r:'common'},
    {id:'espirito_ruina',   name:'Espírito da Ruína',emoji:'👻',r:'common'},
    {id:'golem_argila',     name:'Golem de Argila',  emoji:'🗿',r:'common'},
    {id:'corvo_sombrio_r',  name:'Corvo Sombrio',    emoji:'🐦',r:'common'},
    {id:'fantasma_soldado', name:'Fantasma Soldado', emoji:'👻',r:'uncommon'},
    {id:'rato_ruinas',      name:'Rato das Ruínas',  emoji:'🐀',r:'common'},
    {id:'aranha_veneno2',   name:'Aranha Venenosa',  emoji:'🕷️',r:'common'},
    {id:'totem_maldito',    name:'Totem Maldito',    emoji:'🗿',r:'common'},
    {id:'cobra_jade_r',     name:'Cobra de Jade',    emoji:'🐍',r:'common'},
    {id:'escorpiao_negro',  name:'Escorpião Negro',  emoji:'🦂',r:'uncommon'},
   ],
   elite:{id:'elite_guardiao_ruinas', name:'Guardião das Ruínas',  emoji:'⚔️',r:'uncommon'},
   boss: {id:'boss_escorpiao_rei',    name:'Escorpião Rei',        emoji:'🦂',r:'rare'},
  },
]},

// T3 — Cidade das Brumas
{location:'cidade_brumas', tier:3, biomes:[
  {id:'colinas_nevoa', name:'Colinas da Névoa',
   desc:'Colinas cobertas por névoa espiritual densa. Bestas de vento e trovão patrulham os caminhos.',
   color:'linear-gradient(135deg,#181828 0%,#282838 100%)', accent:'#7090d0',
   mapX:750, mapY:793,
   monsters:[
    {id:'lobo_trovao',      name:'Lobo do Trovão',    emoji:'🐺',r:'common'},
    {id:'aguia_tempestade', name:'Águia Tempestade',  emoji:'🦅',r:'common'},
    {id:'raposa_vento',     name:'Raposa do Vento',   emoji:'🦊',r:'common'},
    {id:'serpente_raio',    name:'Serpente Raio',     emoji:'🐍',r:'uncommon'},
    {id:'urso_glacial',     name:'Urso Glacial',      emoji:'🐻',r:'common'},
    {id:'lince_espiritual', name:'Lince Espiritual',  emoji:'🐆',r:'common'},
    {id:'cabra_qi',         name:'Cabra de Qi',       emoji:'🐐',r:'common'},
    {id:'corvo_sagrado',    name:'Corvo Sagrado',     emoji:'🐦',r:'uncommon'},
    {id:'golem_gelo',       name:'Golem de Gelo',     emoji:'🗿',r:'common'},
    {id:'lobo_ventania',    name:'Lobo da Ventania',  emoji:'🐺',r:'common'},
   ],
   elite:{id:'elite_aguia_tempest',   name:'Águia da Tempestade',  emoji:'🦅',r:'uncommon'},
   boss: {id:'boss_tigre_pico',       name:'Tigre do Pico',        emoji:'🐯',r:'rare'},
  },
  {id:'cavernas_brumas', name:'Cavernas das Brumas',
   desc:'Cavernas úmidas onde o Qi se condensa em névoa. Criaturas cegas e predadoras habitam a escuridão.',
   color:'linear-gradient(135deg,#0a0a0f 0%,#1a1a2e 100%)', accent:'#5c35a0',
   mapX:855, mapY:315,
   monsters:[
    {id:'morcego_espiritual',name:'Morcego Espiritual',emoji:'🦇',r:'common'},
    {id:'escorpiao_brumas',  name:'Escorpião das Brumas',emoji:'🦂',r:'common'},
    {id:'aranha_seda_q',     name:'Aranha de Seda Qi', emoji:'🕷️',r:'uncommon'},
    {id:'verme_cristal',     name:'Verme de Cristal',  emoji:'🪱',r:'common'},
    {id:'lagarto_cego',      name:'Lagarto Cego',      emoji:'🦎',r:'common'},
    {id:'fungo_esporo2',     name:'Fungo Esporos Qi',  emoji:'🍄',r:'common'},
    {id:'cobra_nevoa',       name:'Cobra da Névoa',    emoji:'🐍',r:'common'},
    {id:'rato_mutante',      name:'Rato Mutante',      emoji:'🐀',r:'common'},
    {id:'cristal_vivo',      name:'Cristal Animado',   emoji:'💎',r:'uncommon'},
    {id:'gafanhoto_espiri',  name:'Gafanhoto Espiritual',emoji:'🦗',r:'common'},
   ],
   elite:{id:'elite_aranha_seda',     name:'Rainha da Seda de Qi', emoji:'🕷️',r:'uncommon'},
   boss: {id:'boss_escorpiao_sombra', name:'Escorpião das Sombras',emoji:'🦂',r:'rare'},
  },
  {id:'floresta_mistica', name:'Floresta Mística',
   desc:'Floresta ancestral onde espíritos da natureza e demônios de vinha habitam cada sombra.',
   color:'linear-gradient(135deg,#12080a 0%,#200f12 100%)', accent:'#8c2040',
   mapX:860, mapY:615,
   monsters:[
    {id:'espirito_arvore',   name:'Espírito da Árvore',emoji:'🌳',r:'common'},
    {id:'demonio_vinha',     name:'Demônio da Vinha',  emoji:'🌿',r:'common'},
    {id:'lobo_floresta3',    name:'Lobo da Floresta',  emoji:'🐺',r:'common'},
    {id:'raposa_celestial',  name:'Raposa Celestial',  emoji:'🦊',r:'uncommon'},
    {id:'pajaro_chamas',     name:'Pássaro de Chamas', emoji:'🦅',r:'common'},
    {id:'urso_antigo',       name:'Urso Antigo',       emoji:'🐻',r:'common'},
    {id:'cobra_mistica',     name:'Cobra Mística',     emoji:'🐍',r:'uncommon'},
    {id:'leopardo_sombra',   name:'Leopardo das Sombras',emoji:'🐆',r:'common'},
    {id:'espirito_flor',     name:'Espírito da Flor',  emoji:'🌸',r:'common'},
    {id:'touro_qi',          name:'Touro de Qi',       emoji:'🐂',r:'common'},
   ],
   elite:{id:'elite_espirito_floresta',name:'Espírito Ancião da Floresta',emoji:'🌳',r:'uncommon'},
   boss: {id:'boss_fenix_sombria',    name:'Fênix das Sombras',    emoji:'🦅',r:'rare'},
  },
]},

// T4 — Fortaleza Espiritual
{location:'fortaleza_espiritual', tier:4, biomes:[
  {id:'montanhas_espirituais', name:'Montanhas Espirituais',
   desc:'Picos imponentes onde o Qi espiritual é mais denso. Bestas poderosas dominam os desfiladeiros.',
   color:'linear-gradient(135deg,#0d1825 0%,#182a3a 100%)', accent:'#6090c0',
   mapX:1095, mapY:380,
   monsters:[
    {id:'tigre_chamas',      name:'Tigre das Chamas',  emoji:'🐯',r:'common'},
    {id:'urso_ferro',        name:'Urso de Ferro',     emoji:'🐻',r:'common'},
    {id:'aguia_trovao2',     name:'Águia do Trovão',   emoji:'🦅',r:'uncommon'},
    {id:'serpente_cristal',  name:'Serpente de Cristal',emoji:'🐍',r:'common'},
    {id:'lobo_espiritual',   name:'Lobo Espiritual',   emoji:'🐺',r:'common'},
    {id:'golem_pedra',       name:'Golem de Pedra',    emoji:'🗿',r:'common'},
    {id:'leao_montanha',     name:'Leão da Montanha',  emoji:'🦁',r:'uncommon'},
    {id:'falcao_vento',      name:'Falcão do Vento',   emoji:'🦅',r:'common'},
    {id:'dragao_menor',      name:'Dragão Menor',      emoji:'🐲',r:'uncommon'},
    {id:'pantera_noite',     name:'Pantera da Noite',  emoji:'🐆',r:'common'},
   ],
   elite:{id:'elite_leao_montanha',   name:'Leão Rei da Montanha', emoji:'🦁',r:'uncommon'},
   boss: {id:'boss_dragao_montanha',  name:'Dragão das Montanhas', emoji:'🐲',r:'rare'},
  },
  {id:'vale_ventos', name:'Vale dos Ventos',
   desc:'Vale onde ventos espirituais sopram constantemente. Criaturas de velocidade suprema caçam aqui.',
   color:'linear-gradient(135deg,#1a1508 0%,#2e2510 100%)', accent:'#c8a020',
   mapX:1225, mapY:164,
   monsters:[
    {id:'grifo_jovem',       name:'Grifo Jovem',       emoji:'🦅',r:'uncommon'},
    {id:'lobo_vento',        name:'Lobo do Vento',     emoji:'🐺',r:'common'},
    {id:'pegaso_menor',      name:'Pégaso Menor',      emoji:'🐎',r:'uncommon'},
    {id:'leopardo_espiritu', name:'Leopardo Espiritual',emoji:'🐆',r:'common'},
    {id:'aguia_esmeralda',   name:'Águia Esmeralda',   emoji:'🦅',r:'common'},
    {id:'serpente_raio2',    name:'Serpente Raio',     emoji:'🐍',r:'uncommon'},
    {id:'cavalo_qi',         name:'Cavalo de Qi',      emoji:'🐎',r:'common'},
    {id:'andorinha_qi',      name:'Andorinha de Qi',   emoji:'🐦',r:'common'},
    {id:'tigre_espiritual2', name:'Tigre Espiritual',  emoji:'🐯',r:'common'},
    {id:'urso_trovao',       name:'Urso do Trovão',    emoji:'🐻',r:'common'},
   ],
   elite:{id:'elite_grifo_vento',     name:'Grifo dos Ventos',     emoji:'🦅',r:'uncommon'},
   boss: {id:'boss_pegaso_anciao',    name:'Pégaso Ancião',        emoji:'🐎',r:'rare'},
  },
  {id:'cachoeira_qi', name:'Cachoeira de Qi',
   desc:'Uma poderosa cachoeira cujas águas carregam Qi puro. Dragões aquáticos habitam suas profundezas.',
   color:'linear-gradient(135deg,#081828 0%,#102840 100%)', accent:'#2080c0',
   mapX:1235, mapY:456,
   monsters:[
    {id:'dragao_agua',       name:'Dragão d\'Água',    emoji:'🐉',r:'uncommon'},
    {id:'serpente_gelo',     name:'Serpente de Gelo',  emoji:'🐍',r:'common'},
    {id:'carpa_dourada',     name:'Carpa Dourada',     emoji:'🐟',r:'uncommon'},
    {id:'tartaruga_sagrada', name:'Tartaruga Sagrada', emoji:'🐢',r:'common'},
    {id:'crocodilo_anciao',  name:'Crocodilo Ancião',  emoji:'🐊',r:'common'},
    {id:'peixe_espada',      name:'Peixe-Espada de Qi',emoji:'🐟',r:'common'},
    {id:'cobra_celestial2',  name:'Cobra Celestial',   emoji:'🐍',r:'uncommon'},
    {id:'lontra_espiritual', name:'Lontra Espiritual', emoji:'🦦',r:'common'},
    {id:'polvo_dimensional', name:'Polvo Dimensional', emoji:'🐙',r:'common'},
    {id:'garca_qi',          name:'Garça de Qi',       emoji:'🦢',r:'common'},
   ],
   elite:{id:'elite_carpa_anciao',    name:'Carpa Anciã Transformada',emoji:'🐟',r:'uncommon'},
   boss: {id:'boss_dragao_rio',       name:'Dragão do Rio',        emoji:'🐉',r:'rare'},
  },
]},

// T5 — Cidade do Núcleo
{location:'cidade_nucleo', tier:5, biomes:[
  {id:'planicies_douradas', name:'Planícies Douradas',
   desc:'Planícies impregnadas de energia do Núcleo Dourado. Bestas poderosas patrulham o horizonte.',
   color:'linear-gradient(135deg,#1a1500 0%,#2d2400 100%)', accent:'#f5c518',
   mapX:980, mapY:474,
   monsters:[
    {id:'lobo_nucleo',       name:'Lobo do Núcleo',    emoji:'🐺',r:'common'},
    {id:'leao_pedra',        name:'Leão de Pedra',     emoji:'🦁',r:'common'},
    {id:'touro_celestial',   name:'Touro Celestial',   emoji:'🐂',r:'uncommon'},
    {id:'aguia_dourada',     name:'Águia Dourada',     emoji:'🦅',r:'common'},
    {id:'dragao_bronze',     name:'Dragão de Bronze',  emoji:'🐲',r:'uncommon'},
    {id:'qilin_jovem',       name:'Qilin Jovem',       emoji:'🦄',r:'uncommon'},
    {id:'garuda_menor',      name:'Garuda Menor',      emoji:'🦅',r:'common'},
    {id:'fenix_chamas',      name:'Fênix das Chamas',  emoji:'🔥',r:'uncommon'},
    {id:'tigre_nucleo',      name:'Tigre do Núcleo',   emoji:'🐯',r:'common'},
    {id:'urso_nucleo',       name:'Urso do Núcleo',    emoji:'🐻',r:'common'},
   ],
   elite:{id:'elite_touro_celeste',   name:'Touro Celestial Ancião',emoji:'🐂',r:'uncommon'},
   boss: {id:'boss_dragao_nucleo',    name:'Dragão do Núcleo',     emoji:'🐉',r:'ancient'},
  },
  {id:'deserto_fogo', name:'Deserto de Fogo',
   desc:'Um deserto abrasador onde chamas espirituais brotam do chão.',
   color:'linear-gradient(135deg,#200800 0%,#381000 100%)', accent:'#e04000',
   mapX:1340, mapY:305,
   monsters:[
    {id:'salamandra_fogo',   name:'Salamandra de Fogo',emoji:'🦎',r:'common'},
    {id:'serpente_magma',    name:'Serpente de Magma', emoji:'🐍',r:'common'},
    {id:'ave_chamas',        name:'Ave das Chamas',    emoji:'🦅',r:'uncommon'},
    {id:'golem_lava',        name:'Golem de Lava',     emoji:'🗿',r:'common'},
    {id:'escorpiao_fogo',    name:'Escorpião de Fogo', emoji:'🦂',r:'common'},
    {id:'dragao_fogo_men',   name:'Dragão de Fogo',    emoji:'🐲',r:'uncommon'},
    {id:'touro_chamas',      name:'Touro de Chamas',   emoji:'🐂',r:'common'},
    {id:'fenix_menor',       name:'Fênix Menor',       emoji:'🔥',r:'uncommon'},
    {id:'cobra_lava',        name:'Cobra de Lava',     emoji:'🐍',r:'common'},
    {id:'leao_chamas',       name:'Leão das Chamas',   emoji:'🦁',r:'common'},
   ],
   elite:{id:'elite_fenix_menor',     name:'Fênix do Deserto',     emoji:'🔥',r:'uncommon'},
   boss: {id:'boss_dragao_chamas',    name:'Dragão das Chamas',    emoji:'🐉',r:'ancient'},
  },
  {id:'templo_nucleo', name:'Templo do Núcleo',
   desc:'Templo ancestral onde o Qi se condensa em formas físicas. Guardiões eternos protegem os segredos.',
   color:'linear-gradient(135deg,#0a1520 0%,#102030 100%)', accent:'#20a0c0',
   mapX:1120, mapY:643,
   monsters:[
    {id:'guardiao_cristal2', name:'Guardião de Cristal',emoji:'💎',r:'common'},
    {id:'nucleo_animado',    name:'Núcleo Animado',    emoji:'⚡',r:'uncommon'},
    {id:'golem_jade',        name:'Golem de Jade',     emoji:'🗿',r:'common'},
    {id:'fantasma_nucleo',   name:'Fantasma do Núcleo',emoji:'👻',r:'common'},
    {id:'guerreiro_nucleo',  name:'Guerreiro do Núcleo',emoji:'⚔️',r:'uncommon'},
    {id:'serpente_qi2',      name:'Serpente de Qi Puro',emoji:'🐍',r:'common'},
    {id:'fera_cristal',      name:'Fera Cristalina',   emoji:'💎',r:'common'},
    {id:'sombra_nucleo',     name:'Sombra do Núcleo',  emoji:'👤',r:'common'},
    {id:'totem_antigo',      name:'Totem Antigo',      emoji:'🗿',r:'uncommon'},
    {id:'dragao_qi2',        name:'Dragão de Qi',      emoji:'🐲',r:'uncommon'},
   ],
   elite:{id:'elite_dragao_qi2',      name:'Dragão de Qi Puro',    emoji:'🐲',r:'uncommon'},
   boss: {id:'boss_golem_nucleo',     name:'Golem do Núcleo',      emoji:'🗿',r:'ancient'},
  },
]},

// T6 — Torre das Almas
{location:'torre_almas', tier:6, biomes:[
  {id:'mar_almas', name:'Mar das Almas',
   desc:'Um mar místico onde almas perdidas vagam. Espectros e demônios da alma dominam este plano sombrio.',
   color:'linear-gradient(135deg,#050510 0%,#0d0d20 100%)', accent:'#5555ff',
   mapX:620, mapY:662,
   monsters:[
    {id:'espectro_alma',     name:'Espectro da Alma',  emoji:'👻',r:'common'},
    {id:'fantasma_antigo',   name:'Fantasma Antigo',   emoji:'👻',r:'uncommon'},
    {id:'demonio_alma',      name:'Demônio da Alma',   emoji:'😈',r:'common'},
    {id:'guardiao_almas',    name:'Guardião das Almas',emoji:'⚔️',r:'common'},
    {id:'lobo_fantasma',     name:'Lobo Fantasma',     emoji:'🐺',r:'common'},
    {id:'tigre_trevas',      name:'Tigre das Trevas',  emoji:'🐯',r:'uncommon'},
    {id:'ser_vazio',         name:'Ser do Vazio',      emoji:'🌑',r:'common'},
    {id:'espiral_sombra',    name:'Espiral das Sombras',emoji:'🌀',r:'common'},
    {id:'dragao_alma',       name:'Dragão da Alma',    emoji:'🐲',r:'uncommon'},
    {id:'serpente_vazio',    name:'Serpente do Vazio', emoji:'🐍',r:'common'},
   ],
   elite:{id:'elite_dragao_alma',     name:'Dragão Ancião da Alma',emoji:'🐲',r:'uncommon'},
   boss: {id:'boss_lorde_almas',      name:'Lorde das Almas',      emoji:'💀',r:'ancient'},
  },
  {id:'floresta_sombria', name:'Floresta Sombria',
   desc:'Floresta onde a luz nunca penetra. Demônios e pantheras das sombras caçam no eterno breu.',
   color:'linear-gradient(135deg,#050505 0%,#0f0f0f 100%)', accent:'#aaaaff',
   mapX:750, mapY:944,
   monsters:[
    {id:'pantera_sombra',    name:'Pantera das Sombras',emoji:'🐆',r:'common'},
    {id:'lobo_caos',         name:'Lobo do Caos',      emoji:'🐺',r:'common'},
    {id:'raposa_etern',      name:'Raposa da Eternidade',emoji:'🦊',r:'uncommon'},
    {id:'demonio_sombra',    name:'Demônio das Sombras',emoji:'😈',r:'common'},
    {id:'urso_noite',        name:'Urso da Noite',     emoji:'🐻',r:'common'},
    {id:'cobra_obscura',     name:'Cobra Obscura',     emoji:'🐍',r:'common'},
    {id:'fantasma_guerr',    name:'Fantasma Guerreiro',emoji:'⚔️',r:'uncommon'},
    {id:'espirito_sombra',   name:'Espírito das Sombras',emoji:'👤',r:'common'},
    {id:'leao_trevas',       name:'Leão das Trevas',   emoji:'🦁',r:'uncommon'},
    {id:'aguia_sombria',     name:'Águia Sombria',     emoji:'🦅',r:'common'},
   ],
   elite:{id:'elite_pantera_caos',    name:'Pantera do Caos',      emoji:'🐆',r:'uncommon'},
   boss: {id:'boss_lorde_sombras',    name:'Lorde das Sombras',    emoji:'😈',r:'ancient'},
  },
  {id:'abismo_trevas', name:'Abismo das Trevas',
   desc:'Um abismo sem fundo onde a escuridão é absoluta. Criaturas do vazio supremo residem aqui.',
   color:'linear-gradient(135deg,#020204 0%,#080810 100%)', accent:'#4444aa',
   mapX:870, mapY:812,
   monsters:[
    {id:'besta_vazio',       name:'Besta do Vazio',    emoji:'🌑',r:'common'},
    {id:'guardiao_abismo',   name:'Guardião do Abismo',emoji:'⚔️',r:'uncommon'},
    {id:'espiral_caos',      name:'Espiral do Caos',   emoji:'🌀',r:'common'},
    {id:'demonio_abismo',    name:'Demônio do Abismo', emoji:'😈',r:'uncommon'},
    {id:'dragao_vazio',      name:'Dragão do Vazio',   emoji:'🐲',r:'uncommon'},
    {id:'serpente_caos',     name:'Serpente do Caos',  emoji:'🐍',r:'common'},
    {id:'sombra_eterna',     name:'Sombra Eterna',     emoji:'👤',r:'common'},
    {id:'espectro_caos',     name:'Espectro do Caos',  emoji:'💀',r:'common'},
    {id:'corvino_noite',     name:'Corvino da Noite',  emoji:'🐦',r:'common'},
    {id:'golem_sombra',      name:'Golem das Sombras', emoji:'🗿',r:'common'},
   ],
   elite:{id:'elite_dragao_vazio',    name:'Dragão do Vazio Eterno',emoji:'🐲',r:'uncommon'},
   boss: {id:'boss_senhor_abismo',    name:'Senhor do Abismo',     emoji:'🌑',r:'ancient'},
  },
]},

// T7 — Fortaleza Imperial
{location:'fortaleza_imperial', tier:7, biomes:[
  {id:'palacio_ruinas', name:'Palácio em Ruínas',
   desc:'Ruínas de um palácio imperial. Guardiões caídos e guerreiros imperiais amaldiçoados vagam pelos salões.',
   color:'linear-gradient(135deg,#1a1a0d 0%,#2e2e1a 100%)', accent:'#d4a84b',
   mapX:500, mapY:230,
   monsters:[
    {id:'guerreiro_imperial',name:'Guerreiro Imperial',emoji:'⚔️',r:'common'},
    {id:'cavaleiro_queda',   name:'Cavaleiro Caído',  emoji:'🛡️',r:'uncommon'},
    {id:'estatua_jade',      name:'Estátua de Jade',  emoji:'🗿',r:'common'},
    {id:'fantasma_rei',      name:'Fantasma do Rei',  emoji:'👻',r:'uncommon'},
    {id:'guardiao_imperia',  name:'Guardião Imperial',emoji:'🏰',r:'common'},
    {id:'arqueiro_espirit',  name:'Arqueiro Espiritual',emoji:'🏹',r:'common'},
    {id:'sacerdote_trevas',  name:'Sacerdote das Trevas',emoji:'🧙',r:'uncommon'},
    {id:'escultura_dragao',  name:'Escultura-Dragão', emoji:'🐲',r:'common'},
    {id:'demonio_palacio',   name:'Demônio do Palácio',emoji:'😈',r:'common'},
    {id:'revenant_nobre',    name:'Revenant Nobre',   emoji:'💀',r:'uncommon'},
   ],
   elite:{id:'elite_cavaleiro_imp',   name:'Cavaleiro Imperial Ancião',emoji:'⚔️',r:'uncommon'},
   boss: {id:'boss_rei_caido',        name:'Rei Caído',             emoji:'👑',r:'ancient'},
  },
  {id:'planicies_reis', name:'Planícies dos Reis',
   desc:'Planícies lendárias onde antigos reis cultivadores travaram batalhas épicas. Bestas reais dominam.',
   color:'linear-gradient(135deg,#1a0d00 0%,#2e1800 100%)', accent:'#e08000',
   mapX:680, mapY:118,
   monsters:[
    {id:'tigre_real',        name:'Tigre Real',        emoji:'🐯',r:'common'},
    {id:'leao_rei',          name:'Leão Rei',          emoji:'🦁',r:'uncommon'},
    {id:'dragao_sangue',     name:'Dragão de Sangue',  emoji:'🐲',r:'uncommon'},
    {id:'fenix_real',        name:'Fênix Real',        emoji:'🔥',r:'uncommon'},
    {id:'serpente_divina',   name:'Serpente Divina',   emoji:'🐍',r:'common'},
    {id:'qilin_maduro',      name:'Qilin Maduro',      emoji:'🦄',r:'uncommon'},
    {id:'urso_real',         name:'Urso Real',         emoji:'🐻',r:'common'},
    {id:'garuda_real',       name:'Garuda Real',       emoji:'🦅',r:'uncommon'},
    {id:'lobo_real',         name:'Lobo Real',         emoji:'🐺',r:'common'},
    {id:'pantera_real',      name:'Pantera Real',      emoji:'🐆',r:'common'},
   ],
   elite:{id:'elite_leao_rei',        name:'Leão Rei das Planícies',emoji:'🦁',r:'uncommon'},
   boss: {id:'boss_campeao_real',     name:'Campeão Real',          emoji:'👑',r:'ancient'},
  },
  {id:'fortaleza_corrupta', name:'Fortaleza Corrupta',
   desc:'Antiga fortaleza corrompida por energia demoníaca. Cultivadores caídos e bestas corrompidas a defendem.',
   color:'linear-gradient(135deg,#0a000a 0%,#150015 100%)', accent:'#aa00aa',
   mapX:850, mapY:211,
   monsters:[
    {id:'cultivador_caido',  name:'Cultivador Caído',  emoji:'🧙',r:'uncommon'},
    {id:'guerreiro_caido2',  name:'Guerreiro Caído',   emoji:'⚔️',r:'common'},
    {id:'besta_corrupta',    name:'Besta Corrupta',    emoji:'😈',r:'common'},
    {id:'demonio_corrupto',  name:'Demônio Corrupto',  emoji:'😈',r:'uncommon'},
    {id:'golem_sangue',      name:'Golem de Sangue',   emoji:'🗿',r:'common'},
    {id:'sombra_guerreiro',  name:'Sombra do Guerreiro',emoji:'👤',r:'common'},
    {id:'fantasma_mestre',   name:'Fantasma do Mestre',emoji:'👻',r:'uncommon'},
    {id:'serpente_caos2',    name:'Serpente do Caos',  emoji:'🐍',r:'common'},
    {id:'corvino_maldito',   name:'Corvino Maldito',   emoji:'🐦',r:'common'},
    {id:'espectro_forte',    name:'Espectro Poderoso', emoji:'💀',r:'uncommon'},
   ],
   elite:{id:'elite_mestre_caido',    name:'Mestre Caído',          emoji:'🧙',r:'uncommon'},
   boss: {id:'boss_senhor_corrupto',  name:'Senhor Corrupto',       emoji:'💀',r:'ancient'},
  },
]},

// T8 — Cidade das Estrelas
{location:'cidade_estrelas', tier:8, biomes:[
  {id:'jardim_estelar', name:'Jardim Estelar',
   desc:'Jardim suspenso nas nuvens onde estrelas cadentes deixam rastros de poder celestial.',
   color:'linear-gradient(135deg,#0a0a18 0%,#15153a 100%)', accent:'#4488ff',
   mapX:200, mapY:343,
   monsters:[
    {id:'besta_estelar',     name:'Besta Estelar',     emoji:'⭐',r:'common'},
    {id:'pajaro_celestial',  name:'Pássaro Celestial', emoji:'🦅',r:'uncommon'},
    {id:'lobo_astral',       name:'Lobo Astral',       emoji:'🐺',r:'common'},
    {id:'dragao_celeste',    name:'Dragão Celeste',    emoji:'🐲',r:'uncommon'},
    {id:'fenix_celeste',     name:'Fênix Celeste',     emoji:'🔥',r:'uncommon'},
    {id:'qilin_celeste',     name:'Qilin Celestial',   emoji:'🦄',r:'uncommon'},
    {id:'guardiao_astral',   name:'Guardião Astral',   emoji:'⚔️',r:'common'},
    {id:'tigre_celeste',     name:'Tigre Celestial',   emoji:'🐯',r:'common'},
    {id:'serpente_celeste',  name:'Serpente Celeste',  emoji:'🐍',r:'common'},
    {id:'aguia_celeste',     name:'Águia Celestial',   emoji:'🦅',r:'common'},
   ],
   elite:{id:'elite_fenix_celeste',   name:'Fênix Celestial Anciã',emoji:'🔥',r:'uncommon'},
   boss: {id:'boss_dragao_celeste',   name:'Dragão Celestial',     emoji:'🐉',r:'ancient'},
  },
  {id:'templo_divino', name:'Templo Divino',
   desc:'Templo sagrado guardado por dragões imperiais e guerreiros divinos. Apenas os mais fortes entram.',
   color:'linear-gradient(135deg,#0a0a10 0%,#151520 100%)', accent:'#8888ff',
   mapX:380, mapY:193,
   monsters:[
    {id:'dragao_imperial2',  name:'Dragão Imperial',   emoji:'🐉',r:'uncommon'},
    {id:'leao_sagrado',      name:'Leão Sagrado',      emoji:'🦁',r:'uncommon'},
    {id:'tigre_divino',      name:'Tigre Divino',      emoji:'🐯',r:'common'},
    {id:'guardiao_templo',   name:'Guardião do Templo',emoji:'⚔️',r:'common'},
    {id:'qilin_anciao',      name:'Qilin Ancião',      emoji:'🦄',r:'uncommon'},
    {id:'serpente_imperial', name:'Serpente Imperial', emoji:'🐍',r:'common'},
    {id:'garuda_sagrado',    name:'Garuda Sagrado',    emoji:'🦅',r:'uncommon'},
    {id:'fantasma_divino',   name:'Fantasma Divino',   emoji:'👻',r:'common'},
    {id:'guerreiro_divino',  name:'Guerreiro Divino',  emoji:'⚔️',r:'uncommon'},
    {id:'urso_sagrado',      name:'Urso Sagrado',      emoji:'🐻',r:'common'},
   ],
   elite:{id:'elite_dragao_imp2',     name:'Dragão Imperial Ancião',emoji:'🐉',r:'uncommon'},
   boss: {id:'boss_imperador_dragao', name:'Imperador Dragão',      emoji:'🐉',r:'ancient'},
  },
  {id:'campos_celestes', name:'Campos Celestes',
   desc:'Vastos campos acima das nuvens onde bestas divinas pastam livremente.',
   color:'linear-gradient(135deg,#05050f 0%,#0a0a20 100%)', accent:'#6666cc',
   mapX:560, mapY:80,
   monsters:[
    {id:'lobo_divino',       name:'Lobo Divino',       emoji:'🐺',r:'common'},
    {id:'cavalo_sagrado',    name:'Cavalo Sagrado',    emoji:'🐎',r:'uncommon'},
    {id:'touro_celeste2',    name:'Touro Celestial',   emoji:'🐂',r:'common'},
    {id:'fenix_imperial2',   name:'Fênix Imperial',    emoji:'🔥',r:'uncommon'},
    {id:'besta_paraiso',     name:'Besta do Paraíso',  emoji:'🌟',r:'common'},
    {id:'anjo_guerra',       name:'Anjo da Guerra',    emoji:'👼',r:'uncommon'},
    {id:'leao_celeste',      name:'Leão Celestial',    emoji:'🦁',r:'common'},
    {id:'tigre_paraiso',     name:'Tigre do Paraíso',  emoji:'🐯',r:'common'},
    {id:'serpente_sagrada',  name:'Serpente Sagrada',  emoji:'🐍',r:'common'},
    {id:'guardiao_paraiso',  name:'Guardião do Paraíso',emoji:'⚔️',r:'common'},
   ],
   elite:{id:'elite_fenix_imperial',  name:'Fênix Imperial Anciã', emoji:'🔥',r:'uncommon'},
   boss: {id:'boss_anjo_guerra',      name:'Anjo da Guerra Ancião',emoji:'👼',r:'ancient'},
  },
]},

// T9 — Palácio Celestial
{location:'palacio_celestial', tier:9, biomes:[
  {id:'mar_celestial', name:'Mar Celestial',
   desc:'Oceano de energia pura onde dragões do mar celestial emergem das profundezas eternas.',
   color:'linear-gradient(135deg,#02020a 0%,#05051a 100%)', accent:'#3366ff',
   mapX:150, mapY:662,
   monsters:[
    {id:'dragao_mar_cel',    name:'Dragão do Mar',     emoji:'🐉',r:'uncommon'},
    {id:'serpente_mareal',   name:'Serpente Mareal',   emoji:'🐍',r:'common'},
    {id:'besta_oceano',      name:'Besta do Oceano',   emoji:'🌊',r:'common'},
    {id:'guardian_celest2',  name:'Guardião Celestial',emoji:'⚔️',r:'common'},
    {id:'fenix_sagrada',     name:'Fênix Sagrada',     emoji:'🔥',r:'uncommon'},
    {id:'lobo_imortal',      name:'Lobo Imortal',      emoji:'🐺',r:'uncommon'},
    {id:'ser_celestial',     name:'Ser Celestial',     emoji:'✨',r:'common'},
    {id:'kraken_qi',         name:'Kraken de Qi',      emoji:'🐙',r:'uncommon'},
    {id:'baleia_astral',     name:'Baleia Astral',     emoji:'🐋',r:'common'},
    {id:'aguia_imortal',     name:'Águia Imortal',     emoji:'🦅',r:'common'},
   ],
   elite:{id:'elite_dragao_mar',      name:'Dragão do Mar Celestial',emoji:'🐉',r:'uncommon'},
   boss: {id:'boss_soberano_mar',     name:'Soberano do Mar',       emoji:'🌊',r:'ancient'},
  },
  {id:'jardim_imortais', name:'Jardim dos Imortais',
   desc:'Jardim eterno onde imortais meditam por eras. A energia aqui transcende a compreensão mortal.',
   color:'linear-gradient(135deg,#080808 0%,#121212 100%)', accent:'#ffdd55',
   mapX:320, mapY:531,
   monsters:[
    {id:'raposa_imortal',    name:'Raposa Imortal',    emoji:'🦊',r:'uncommon'},
    {id:'dragao_eterno',     name:'Dragão Eterno',     emoji:'🐲',r:'uncommon'},
    {id:'fenix_divina',      name:'Fênix Divina',      emoji:'🔥',r:'uncommon'},
    {id:'qilin_eterno',      name:'Qilin Eterno',      emoji:'🦄',r:'uncommon'},
    {id:'tigre_imortal',     name:'Tigre Imortal',     emoji:'🐯',r:'common'},
    {id:'lobo_eterno',       name:'Lobo Eterno',       emoji:'🐺',r:'common'},
    {id:'leao_imortal',      name:'Leão Imortal',      emoji:'🦁',r:'uncommon'},
    {id:'garuda_eterno',     name:'Garuda Eterno',     emoji:'🦅',r:'uncommon'},
    {id:'urso_celeste',      name:'Urso Celestial',    emoji:'🐻',r:'common'},
    {id:'serpente_eterna',   name:'Serpente Eterna',   emoji:'🐍',r:'common'},
   ],
   elite:{id:'elite_qilin_eterno',    name:'Qilin dos Imortais',   emoji:'🦄',r:'uncommon'},
   boss: {id:'boss_dragao_imortal',   name:'Dragão dos Imortais',  emoji:'🐉',r:'ancient'},
  },
  {id:'torre_destino', name:'Torre do Destino',
   desc:'Torre que toca os céus onde o destino de cada cultivador é tecido. Guardiões do destino vigiam.',
   color:'linear-gradient(135deg,#020208 0%,#040412 100%)', accent:'#aa88ff',
   mapX:480, mapY:380,
   monsters:[
    {id:'guardiao_destino',  name:'Guardião do Destino',emoji:'⚔️',r:'uncommon'},
    {id:'besta_destino',     name:'Besta do Destino',  emoji:'🔮',r:'common'},
    {id:'fantasma_destino',  name:'Fantasma do Destino',emoji:'👻',r:'common'},
    {id:'dragao_destino',    name:'Dragão do Destino', emoji:'🐲',r:'uncommon'},
    {id:'lobo_destino',      name:'Lobo do Destino',   emoji:'🐺',r:'common'},
    {id:'fenix_destino',     name:'Fênix do Destino',  emoji:'🔥',r:'uncommon'},
    {id:'eterno_guardiao',   name:'Guardião Eterno',   emoji:'✨',r:'common'},
    {id:'voidwalker',        name:'Caminhante do Vazio',emoji:'🌑',r:'uncommon'},
    {id:'serpente_destino',  name:'Serpente do Destino',emoji:'🐍',r:'common'},
    {id:'tigre_destino',     name:'Tigre do Destino',  emoji:'🐯',r:'common'},
   ],
   elite:{id:'elite_guardiao_dest',   name:'Grande Guardião do Destino',emoji:'🔮',r:'uncommon'},
   boss: {id:'boss_lorde_destino',    name:'Lorde do Destino',     emoji:'🔮',r:'ancient'},
  },
]},

// T10 — Templo do Dao
{location:'templo_dao', tier:10, biomes:[
  {id:'plano_dao', name:'Plano do Dao',
   desc:'Plano onde o Dao primordial flui livremente. Entidades do Dao em sua forma mais pura existem aqui.',
   color:'linear-gradient(135deg,#020202 0%,#050505 100%)', accent:'#aaffaa',
   mapX:120, mapY:230,
   monsters:[
    {id:'besta_dao',         name:'Besta do Dao',      emoji:'☯️',r:'uncommon'},
    {id:'dragao_primordial', name:'Dragão Primordial', emoji:'🐉',r:'uncommon'},
    {id:'guardiao_vazio',    name:'Guardião do Vazio', emoji:'🌑',r:'common'},
    {id:'entidade_caos',     name:'Entidade do Caos',  emoji:'💫',r:'uncommon'},
    {id:'lobo_vazio2',       name:'Lobo do Vazio',     emoji:'🐺',r:'common'},
    {id:'fenix_primordial',  name:'Fênix Primordial',  emoji:'🔥',r:'uncommon'},
    {id:'ser_dao',           name:'Ser do Dao',        emoji:'✨',r:'common'},
    {id:'dragao_caos2',      name:'Dragão do Caos',    emoji:'🐲',r:'uncommon'},
    {id:'qilin_primordial',  name:'Qilin Primordial',  emoji:'🦄',r:'uncommon'},
    {id:'serpente_primord',  name:'Serpente Primordial',emoji:'🐍',r:'common'},
   ],
   elite:{id:'elite_dragao_primord',  name:'Dragão Primordial Ancião',emoji:'🐉',r:'uncommon'},
   boss: {id:'boss_soberano_dao',     name:'Soberano do Dao',       emoji:'☯️',r:'legendary'},
  },
  {id:'dominio_eterno', name:'Domínio Eterno',
   desc:'Domínio onde a eternidade existe além do tempo. Criaturas da criação e do caos coexistem.',
   color:'linear-gradient(135deg,#010101 0%,#030303 100%)', accent:'#ffaaaa',
   mapX:280, mapY:155,
   monsters:[
    {id:'ser_criacao',       name:'Ser da Criação',    emoji:'🌌',r:'uncommon'},
    {id:'criatura_caos',     name:'Criatura do Caos',  emoji:'💫',r:'uncommon'},
    {id:'besta_eterno',      name:'Besta Eterna',      emoji:'⏳',r:'common'},
    {id:'dragao_criacao',    name:'Dragão da Criação', emoji:'🐲',r:'uncommon'},
    {id:'guardiao_dao',      name:'Guardião do Dao',   emoji:'☯️',r:'common'},
    {id:'fenix_eterna',      name:'Fênix Eterna',      emoji:'🔥',r:'uncommon'},
    {id:'lobo_criacao',      name:'Lobo da Criação',   emoji:'🐺',r:'common'},
    {id:'voidlord',          name:'Senhor do Vazio',   emoji:'🌑',r:'uncommon'},
    {id:'deus_besta',        name:'Deus-Besta',        emoji:'👁️',r:'uncommon'},
    {id:'serpente_criacao',  name:'Serpente da Criação',emoji:'🐍',r:'common'},
   ],
   elite:{id:'elite_criatura_caos',   name:'Criatura do Caos Eterno',emoji:'💫',r:'uncommon'},
   boss: {id:'boss_imperador_caos',   name:'Imperador do Caos',     emoji:'💫',r:'legendary'},
  },
  {id:'altar_dao', name:'Altar do Dao Absoluto',
   desc:'Altar supremo onde o Dao primordial se manifesta. Apenas os imortais verdadeiros sobrevivem.',
   color:'linear-gradient(135deg,#000000 0%,#020202 100%)', accent:'#ffffff',
   mapX:440, mapY:80,
   monsters:[
    {id:'guardiao_absoluto', name:'Guardião Absoluto', emoji:'⚔️',r:'uncommon'},
    {id:'dragao_dao_eterno', name:'Dragão do Dao Eterno',emoji:'🐉',r:'uncommon'},
    {id:'besta_absoluta',    name:'Besta Absoluta',    emoji:'👁️',r:'uncommon'},
    {id:'entidade_dao',      name:'Entidade do Dao',   emoji:'☯️',r:'uncommon'},
    {id:'fenix_absoluta',    name:'Fênix Absoluta',    emoji:'🔥',r:'uncommon'},
    {id:'ser_primordial',    name:'Ser Primordial',    emoji:'✨',r:'common'},
    {id:'lobo_absoluto',     name:'Lobo Absoluto',     emoji:'🐺',r:'common'},
    {id:'soberano_besta',    name:'Soberano-Besta',    emoji:'🌟',r:'uncommon'},
    {id:'dragao_vazio3',     name:'Dragão do Vazio',   emoji:'🐲',r:'uncommon'},
    {id:'serpente_absoluta', name:'Serpente Absoluta', emoji:'🐍',r:'common'},
   ],
   elite:{id:'elite_guardiao_dao',    name:'Grande Guardião do Dao',emoji:'☯️',r:'uncommon'},
   boss: {id:'boss_soberano_eterno',  name:'Soberano Eterno',       emoji:'🌟',r:'legendary'},
  },
]},
]

// ══════════════════════════════════════════════════════
// GERAR LOCALIZAÇÕES
// ══════════════════════════════════════════════════════

const LOCATION_SERVICES_VILLAGE = ['meditation','talents','inventory','codex','ranking','map','skills','changelog']
const LOCATION_SERVICES_CITY    = ['meditation','talents','inventory','codex','ranking','map','forge','ascension','crafting','market','training','skills','laws','sect','merchants','changelog']

const LOCATION_META = {
  vila_despertar:        {name:'Vila do Despertar',    emoji:'🏘️',type:'village',realm:'body_tempering',stage:'strength',  boss:null,              x:280, y:900, conn:['cidade_jade']},
  cidade_jade:           {name:'Cidade do Jade',       emoji:'🏙️',type:'city',   realm:'body_tempering',stage:'eight_gates',boss:'boss_escorpiao_rei',x:620, y:700, conn:['vila_despertar','cidade_brumas']},
  cidade_brumas:         {name:'Cidade das Brumas',    emoji:'🌫️',type:'city',   realm:'houtian',       stage:'initial',   boss:'boss_fenix_sombria', x:900, y:860, conn:['cidade_jade','fortaleza_espiritual']},
  fortaleza_espiritual:  {name:'Fortaleza Espiritual', emoji:'🏯',type:'city',   realm:'houtian',       stage:'peak',      boss:'boss_dragao_rio',    x:1280,y:170, conn:['cidade_brumas','cidade_nucleo']},
  cidade_nucleo:         {name:'Cidade do Núcleo',     emoji:'⚙️',type:'city',   realm:'xiantian',      stage:'initial',   boss:'boss_golem_nucleo',  x:1200,y:430, conn:['fortaleza_espiritual','torre_almas']},
  torre_almas:           {name:'Torre das Almas',      emoji:'🗼',type:'city',   realm:'xiantian',      stage:'peak',      boss:'boss_senhor_abismo',  x:750, y:550, conn:['cidade_nucleo','fortaleza_imperial']},
  fortaleza_imperial:    {name:'Fortaleza Imperial',   emoji:'🏰',type:'city',   realm:'revolving_core',stage:'initial',   boss:'boss_senhor_corrupto',x:700, y:210,  conn:['torre_almas','cidade_estrelas']},
  cidade_estrelas:       {name:'Cidade das Estrelas',  emoji:'⭐',type:'city',   realm:'revolving_core',stage:'peak',      boss:'boss_anjo_guerra',   x:380, y:170,   conn:['fortaleza_imperial','palacio_celestial']},
  palacio_celestial:     {name:'Palácio Celestial',    emoji:'🏛️',type:'city',   realm:'life_destruction',stage:'destruction_5',boss:'boss_lorde_destino',x:320,y:300, conn:['cidade_estrelas','templo_dao']},
  templo_dao:            {name:'Templo do Dao',        emoji:'⛩️',type:'city',   realm:'divine_sea',    stage:'initial',   boss:'boss_soberano_eterno',x:280,y:80,   conn:['palacio_celestial']},
}

const locations = Object.entries(LOCATION_META).map(([id,meta],i)=>({
  id,
  name: meta.name,
  description: `Localização nível ${i}: ${meta.name}`,
  emoji: meta.emoji,
  type: meta.type,
  required_realm: meta.realm,
  required_stage: meta.stage,
  required_boss_id: meta.boss,
  map_x: meta.x,
  map_y: meta.y,
  connected_to: meta.conn,
  services: meta.type==='village' ? LOCATION_SERVICES_VILLAGE : LOCATION_SERVICES_CITY,
  sort_order: i+1,
}))

// ══════════════════════════════════════════════════════
// GERAR BIOMAS
// ══════════════════════════════════════════════════════

const REALM_STAGES = {
  vila_despertar:       {realm:'body_tempering',stage:'strength'},
  cidade_jade:          {realm:'body_tempering',stage:'eight_gates'},
  cidade_brumas:        {realm:'houtian',       stage:'initial'},
  fortaleza_espiritual: {realm:'houtian',       stage:'peak'},
  cidade_nucleo:        {realm:'xiantian',      stage:'initial'},
  torre_almas:          {realm:'xiantian',      stage:'peak'},
  fortaleza_imperial:   {realm:'revolving_core',stage:'initial'},
  cidade_estrelas:      {realm:'revolving_core',stage:'peak'},
  palacio_celestial:    {realm:'life_destruction',stage:'destruction_5'},
  templo_dao:           {realm:'divine_sea',    stage:'initial'},
}

const ACTIVE_DAYS = [0,1,2,3,4,5,6]

const allBiomes = []
for(const city of WORLD){
  const rs = REALM_STAGES[city.location]
  city.biomes.forEach((b,bi)=>{
    allBiomes.push({
      id:         b.id,
      name:       b.name,
      description:b.desc,
      required_realm: rs.realm,
      required_stage: rs.stage,
      difficulty:  (city.tier-1)*3 + bi + 1,
      biome_type: 'fixed',
      active_days: ACTIVE_DAYS,
      enemy_pool:  b.monsters.map(m=>m.id),
      boss_id:     b.boss.id,
      elite_id:    b.elite.id,
      min_kills_boss:   20 + city.tier*5,
      min_kills_elite:  12 + city.tier*3,
      boss_spawn_chance: 0.20,
      gradient:    b.color,
      accent_color:b.accent,
      rarity_weights: (() => {
        const t=city.tier
        if(t<=2) return {common:80,uncommon:20}
        if(t<=4) return {common:65,uncommon:28,spiritual:7}
        if(t<=6) return {common:50,uncommon:28,spiritual:15,rare:7}
        if(t<=8) return {common:35,uncommon:25,spiritual:20,rare:15,ancient:5}
        return {common:20,uncommon:18,spiritual:20,rare:22,ancient:15,legendary:5}
      })(),
      boss_rarity: city.tier>=9?'legendary':city.tier>=7?'ancient':'rare',
      sort_order:  (city.tier-1)*3 + bi + 1,
      location_id: city.location,
      map_x:       b.mapX,
      map_y:       b.mapY,
      target_power:0,
    })
  })
}

// ══════════════════════════════════════════════════════
// GERAR MONSTROS
// ══════════════════════════════════════════════════════

// Carrega IDs válidos de receitas
const receitasItems = JSON.parse(fs.readFileSync(path.join(root,'data-import/receitas_items.json'),'utf8'))
const validReceitaIds = new Set(receitasItems.map(i=>i.id))

function getValidForgeRecipes(tier){
  if(tier<2)return[]
  return FORGE_TYPES.map(t=>`receita_forge_${t}_t${tier}`).filter(id=>validReceitaIds.has(id))
}
function getValidAlchRecipes(tier){
  if(tier<2)return[]
  return [`alchemy_pill_buff_atk_t${tier}`,`alchemy_pill_buff_def_t${tier}`,
    `alchemy_pill_buff_hp_t${tier}`,`alchemy_pill_buff_crit_t${tier}`,
    `alchemy_pill_meditation_t${tier}`].map(r=>`receita_${r}`).filter(id=>validReceitaIds.has(id))
}

const allMonsters = []

for(const city of WORLD){
  const tier = city.tier
  const s = TIER_STATS[tier]
  const mats = MATERIALS[tier]
  const forgeRec = getValidForgeRecipes(tier)
  const alchRec  = getValidAlchRecipes(tier)
  const recChunkSz = city.biomes.length>0 ? Math.ceil(forgeRec.length/city.biomes.length) : 1

  city.biomes.forEach((biome,bIdx)=>{
    const bossForge = forgeRec.slice(bIdx*recChunkSz,(bIdx+1)*recChunkSz)

    // Drops para normais
    const normalDrops = [
      {itemId:mats[0],chance:0.65,quantityMin:1,quantityMax:2},
      {itemId:mats[1],chance:0.55,quantityMin:1,quantityMax:2},
    ]
    if(tier>=3) normalDrops.push({itemId:mats[2],chance:0.25,quantityMin:1,quantityMax:1})
    for(const r of alchRec) normalDrops.push({itemId:r,chance:0.008,quantityMin:1,quantityMax:1})

    // Drops para boss
    const bossDrops = [
      {itemId:mats[2],chance:0.75,quantityMin:2,quantityMax:5},
      {itemId:mats[3],chance:0.65,quantityMin:1,quantityMax:3},
    ]
    for(const r of bossForge.slice(0,9)) bossDrops.push({itemId:r,chance:0.20,quantityMin:1,quantityMax:1})

    // Drops para elite (outra metade das receitas)
    const eliteDrops = [
      {itemId:mats[0],chance:0.80,quantityMin:2,quantityMax:4},
      {itemId:mats[1],chance:0.70,quantityMin:1,quantityMax:3},
    ]
    for(const r of bossForge.slice(9)) eliteDrops.push({itemId:r,chance:0.10,quantityMin:1,quantityMax:1})
    for(const r of alchRec.slice(0,3)) eliteDrops.push({itemId:r,chance:0.025,quantityMin:1,quantityMax:1})

    // Gerar 10 normais
    for(const mob of biome.monsters){
      const hMod = 0.75+Math.random()*0.5
      const aMod = 0.75+Math.random()*0.5
      allMonsters.push({
        id:mob.id, name:mob.name, emoji:mob.emoji,
        level_min:s.lvMin, level_max:Math.min(s.lvMin+3,s.lvMax),
        rarity:mob.r, biome_id:biome.id,
        is_boss:false, is_elite:false,
        base_hp:  Math.round(between(s.hp)*hMod),
        base_atk: Math.round(between(s.atk)*aMod),
        base_def: between(s.def),
        speed:    +(s.speed[0]+(Math.random()*(s.speed[1]-s.speed[0]))).toFixed(1),
        qi_reward:  between([Math.round(s.qi[0]*0.8),Math.round(s.qi[1]*1.2)]),
        gold_reward_min: s.gMin,
        gold_reward_max: Math.round(s.gMax*0.6),
        drop_table: normalDrops.map(d=>({...d})),
      })
    }

    // Elite
    allMonsters.push({
      id:biome.elite.id, name:biome.elite.name, emoji:biome.elite.emoji,
      level_min:s.lvMax-2, level_max:s.lvMax,
      rarity:'uncommon', biome_id:biome.id,
      is_boss:false, is_elite:true,
      base_hp:  Math.round(between(s.hp)*5),
      base_atk: Math.round(between(s.atk)*2),
      base_def: Math.round(between(s.def)*2),
      speed:    +(1.6+Math.random()*0.3).toFixed(1),
      qi_reward:  Math.round(between(s.qi)*5),
      gold_reward_min: s.gMin*4,
      gold_reward_max: s.gMax*4,
      drop_table: eliteDrops.map(d=>({...d})),
    })

    // Boss
    const bRar = tier>=9?'legendary':tier>=7?'ancient':'rare'
    allMonsters.push({
      id:biome.boss.id, name:biome.boss.name, emoji:biome.boss.emoji,
      level_min:s.lvMax-1, level_max:s.lvMax+2,
      rarity:bRar, biome_id:biome.id,
      is_boss:true, is_elite:false,
      base_hp:  Math.round(between(s.hp)*20),
      base_atk: Math.round(between(s.atk)*3),
      base_def: Math.round(between(s.def)*3),
      speed:    +(2.5+Math.random()*0.5).toFixed(1),
      qi_reward:  Math.round(between(s.qi)*15),
      gold_reward_min: s.gMin*12,
      gold_reward_max: s.gMax*12,
      drop_table: bossDrops.map(d=>({...d})),
    })
  })
}

// ══════════════════════════════════════════════════════
// ESCREVER ARQUIVOS
// ══════════════════════════════════════════════════════

const di = path.join(root,'data-import')
fs.writeFileSync(path.join(di,'locations.json'),     JSON.stringify(locations,  null,2))
fs.writeFileSync(path.join(di,'biomas_novos.json'),  JSON.stringify(allBiomes,  null,2))
fs.writeFileSync(path.join(di,'monstros_fase2.json'),JSON.stringify(allMonsters,null,2))

console.log(`✓ locations.json:     ${locations.length} locais`)
console.log(`✓ biomas_novos.json:  ${allBiomes.length} biomas`)
console.log(`✓ monstros_fase2.json:${allMonsters.length} monstros`)

// Verificação rápida de IDs únicos
const monIds = allMonsters.map(m=>m.id)
const dupIds = monIds.filter((id,i)=>monIds.indexOf(id)!==i)
if(dupIds.length) console.warn('⚠️ IDs duplicados:', [...new Set(dupIds)])
else console.log('✓ Todos os IDs de monstros são únicos')
