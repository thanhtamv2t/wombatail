// Wombatail/Unistyles configuration must load before app components create stylesheets.
import './wombatail.config'

import { registerRootComponent } from 'expo'
import App from './src/App'

registerRootComponent(App)
