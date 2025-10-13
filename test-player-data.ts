// Test script to check player data loading
import { sleeperAPI } from './lib/sleeper-api'

async function testPlayerData() {
  try {
    console.log('Testing Sleeper getAllPlayers API...\n')

    const players = await sleeperAPI.getAllPlayers('nfl')

    console.log(`Total players loaded: ${Object.keys(players).length}`)

    // Test specific known player IDs
    const testPlayerIds = ['4046', '4017', '6794', '4881'] // Josh Allen, CMC, Cooper Kupp, Travis Kelce

    console.log('\nTesting known players:')
    testPlayerIds.forEach(id => {
      const player = players[id]
      if (player) {
        console.log(`✅ ${id}: ${player.full_name} (${player.position} - ${player.team})`)
      } else {
        console.log(`❌ ${id}: NOT FOUND`)
      }
    })

    // Sample some random players
    console.log('\nSample of loaded players:')
    const playerIds = Object.keys(players).slice(0, 10)
    playerIds.forEach(id => {
      const player = players[id]
      console.log(`  ${id}: ${player.full_name || 'NO NAME'} (${player.position || 'NO POS'} - ${player.team || 'NO TEAM'})`)
    })

    // Check if we got mock data or real data
    if (Object.keys(players).length === 4) {
      console.log('\n⚠️  WARNING: Only 4 players loaded - this looks like mock data!')
    } else if (Object.keys(players).length > 1000) {
      console.log('\n✅ Real player data loaded successfully!')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testPlayerData()
