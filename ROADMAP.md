# Dao Eterno — Roadmap de Ideias

> Gerado em 2026-06-03. Ideias discutidas e aprovadas para implementação futura.

---

## 🌱 Sistemas Novos

### 1. Colheita de Plantas / Herborismo
Nós de "Bosque" ou "Jardim" no mapa mundial onde o personagem fica em modo idle de colheita (similar à meditação, mas gera materiais herbáceos em vez de Qi). Os materiais seriam ingredientes exclusivos de alquimia avançada.
- Novo tipo de localização: `gathering`
- Interface similar à meditação (timer, slots de colheita)
- Materiais específicos por bioma/região

### 2. Missões Diárias e Semanais
Cards de missões no hub com objetivos variados:
- "Mate 30 inimigos nas Cavernas Rasas"
- "Craft 5 pílulas de ascensão"
- "Rompa 1 vez no cultivo"
- "Visite a Cidade do Jade"

Recompensas: ouro, materiais raros, pontos de talento extras. Renovação automática (daily às 00h, weekly na segunda).

### 3. Dungeons / Masmorras
Locais especiais no mapa — entrada única por dia, sem auto-batalha, andares progressivos com boss final e drops únicos de alta raridade.
- Tipo de localização: `dungeon`
- Sem auto-batalha — requer atenção ativa
- Boss final com item exclusivo garantido
- Cooldown diário por personagem

### 4. Habilidades Ativas de Classe em Combate
Cada classe tem 1-2 habilidades especiais ativáveis durante o combate:
- Cooldown em segundos
- Custo de Qi
- Efeitos únicos por classe (ex: Espadachim — "Corte Celestial": triplica próximo golpe; Arqueiro — "Chuva de Flechas": 3 ataques simultâneos)
- Desbloqueadas via árvore de talentos ou realm mínimo

### 5. Herança de Lenda (Prestige Suave)
Quando um personagem morre e vira lenda, o próximo personagem criado recebe um bônus permanente baseado no poder do antecessor:
- +1-5% em algum stat base (calculado do cultivation_power)
- Máximo acumulável configurável pelo admin
- Incentiva ciclos de jogo e morte como progressão

### 6. Conquistas / Achievements
Sistema de conquistas desbloqueadas por marcos:
- Primeiro boss morto
- Primeiro rompimento
- Chegar ao Houtian / Pré-Celestial / etc.
- Craft de item lendário
- 1000 kills totais

Recompensas: ouro, materiais, talismãs especiais. Tela dedicada no hub.

---

## 🏙️ Expansão do Mundo

### 7. Seita / Guilda
O placeholder "SEITA" no hub já existe — transformar em sistema real:
- Criar ou entrar em seitas
- Ranking de seitas por cultivation_power total
- Recursos compartilhados (baú da seita)
- Buffs coletivos para membros
- Hierarquia (fundador, ancião, discípulo)

### 8. Eventos de Mundo Temporários
Eventos que aparecem no mapa por tempo limitado:
- "Invasão de Demônios": bioma com monstros 2× mais fortes, drops 2× melhores por 24h
- "Festival do Jade": crafting com 50% desconto de materiais por 6h
- "Chuva de Qi": meditação 3× mais rápida por 2h
- Configurável pelo admin com data de início/fim

### 9. Mercadores de Cidade (NPCs)
NPCs fixos nas cidades vendendo itens raros por moedas especiais ("Cristais do Dao" obtidos de boss kills):
- Loja separada do mercado de jogadores
- Itens exclusivos não craftáveis
- Estoque rotativo (semanal)

---

## ⚙️ Melhorias em Sistemas Existentes

### 10. Ficha Completa do Personagem
Tela dedicada mostrando TODOS os stats de forma clara e organizada:
- Stats base + bônus de equip + talentos + leis + buffs ativos
- Comparação antes de equipar/desequipar
- DPS projetado, survivability, stats de Qi

### 11. Codex Expandido
- Contador de kills por monstro com barra de progresso (ex: 50/100 kills desbloqueiam drop especial)
- % de drops descobertos por bioma
- Contador de itens craftados
- Integração com mapa: clicar num monstro no codex abre o bioma no mapa

### 12. Rompimento com Efeito Visual Dramático
Modal de rompimento com animação/efeito especial nos marcos importantes:
- Entrar no Houtian (primeiro grande salto)
- Life Destruction (destruição e renascimento)
- Senhor Divino / Empíreo / além
- Partículas, flash de tela, música

### 13. Refinamento de Materiais
Sistema simples via aba de Alquimia:
- Combinar N materiais de tier X → 1 material de tier X+1
- Taxa configurável pelo admin
- Permite progressão de materiais sem depender de biomas de alto nível

### 14. Reputação por Localização
Ao passar tempo numa cidade (kills nos biomas locais), o personagem acumula reputação:
- Descontos progressivos no mercado local
- Acesso a itens exclusivos do NPC local com reputação alta
- Título/badge de "Honrado Cidadão do Jade", etc.

---

## 🎯 Quick Wins (alta relação impacto/esforço)

| Feature | Descrição |
|---------|-----------|
| **Notificações in-game** | Popup/toast quando meditação termina, item raro cai, pode romper |
| **Histórico de batalha** | Últimas N batalhas com resultados, drops, Qi ganho |
| **Comparação de itens** | Ao passar o mouse num item, mostra diff de stats vs equipado atual |
| **Auto-venda** | Configurar categorias/raridades para vender automaticamente ao voltar do combate |
| **Indicador de nível de craft** | Barra de progresso da skill de forja/alquimia/inscrição mais visível |
| **Notificação de servidor** | Banner quando admin coloca manutenção ou evento |

---

## 📋 Prioridade Sugerida

1. **Colheita de Plantas** — extensão natural do sistema de localizações já implementado
2. **Missões Diárias** — loop de jogo mais claro, retenção de jogadores
3. **Ficha do Personagem** — QoL importante, jogadores querem ver todos os stats
4. **Habilidades Ativas** — transforma fundamentalmente a experiência de combate
5. **Conquistas** — motivação de longo prazo, fácil de implementar
6. **Dungeons** — conteúdo desafiador para jogadores avançados
7. **Herança de Lenda** — loop de prestige, incentiva múltiplos personagens
8. **Seita** — feature social, requer mais jogadores ativos para ser relevante

---

*Última atualização: 2026-06-03*
