import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import ECharts from 'vue-echarts'
import { use } from "echarts/core"
import "../node_modules/bootstrap/scss/bootstrap.scss";
import router from "./router";
// import ECharts modules manually to reduce bundle size
import {
CanvasRenderer
} from 'echarts/renderers'
import {
LineChart
} from 'echarts/charts'
import {
GridComponent,
TooltipComponent,
DataZoomComponent,
MarkAreaComponent
} from 'echarts/components'

use([
CanvasRenderer,
LineChart,
GridComponent,
TooltipComponent,
DataZoomComponent,
MarkAreaComponent
])


const pinia = createPinia()
const app = createApp(App)
app.component('v-chart', ECharts)
app.use(pinia)
app.use(router);
app.mount('#app')
