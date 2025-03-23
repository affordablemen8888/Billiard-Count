import {
	createSSRApp
} from "vue";
import App from "./App.vue";
import { setupRouteGuard } from './api/routeGuard';
import { initNetworkMonitor } from './api/networkMonitor';

// 安装路由守卫
setupRouteGuard();

// 初始化网络监听器
initNetworkMonitor();

export function createApp() {
	const app = createSSRApp(App);
	return {
		app,
	};
}
