declare module "*.css" {
	const content: Record<string, string>;
	export default content;
};

declare module "*.scss" {
	const content: Record<string, string>;
	export default content;
};

declare let PRODUCTION: boolean;
declare let KIH_VERSION: string;
declare let EASYUI_INCLUDES: string[];