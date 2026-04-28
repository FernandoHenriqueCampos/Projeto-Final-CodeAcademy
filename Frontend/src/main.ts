import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@/assets/styles/theme.css'
import { useTheme } from '@/composables/useTheme'

const app = createApp(App)
const { hydrateTheme } = useTheme()

hydrateTheme()

app.use(createPinia())
app.use(router)
app.mount('#app')
