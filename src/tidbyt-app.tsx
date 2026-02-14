import { Root, Box, Column, Row, Text, Marquee } from 'typlit'
import { readFileSync, existsSync } from 'fs'

const DATA_FILE = '/tmp/tidbyt-data.json'

type TidbytData = {
  claudeUsage: string | null
  projectIdea: string
  joke: string
  fetchedAt: number
}

function loadData(): TidbytData {
  if (existsSync(DATA_FILE)) {
    try {
      return JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
    } catch {}
  }
  return {
    claudeUsage: null,
    projectIdea: 'Agent Builder',
    joke: 'Loading jokes...',
    fetchedAt: 0,
  }
}

export default function Main() {
  const data = loadData()
  
  // Colors
  const cyan = '#7CFFFF'
  const green = '#7CFF7C'
  const yellow = '#FFFF7C'
  
  const now = new Date()
  const time = now.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })
  
  // Simple 3-line display with short text to minimize frames
  return (
    <Root delay={100}>
      <Box color="#0a0a0a" padding={2}>
        <Column expanded mainAlign="space_evenly" crossAlign="center">
          <Text content={time} color={cyan} font="6x13" />
          <Text content={data.projectIdea.slice(0, 12)} color={green} font="tom-thumb" />
          {data.claudeUsage && (
            <Text content={data.claudeUsage.slice(0, 12)} color={yellow} font="tom-thumb" />
          )}
        </Column>
      </Box>
    </Root>
  )
}
