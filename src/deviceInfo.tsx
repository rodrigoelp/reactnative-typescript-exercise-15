import { Dimensions, Platform, PlatformIOSStatic, PlatformOSType, StatusBar } from "react-native";

export enum PlatformType {
    iOs = "ios",
    Android = "android",
    MacOs = "macos",
    Windows = "windows",
    Web = "web"
}

export interface DeviceInfo {
    platformType: PlatformType,
    statusBarHeight: number;
}

export function getDeviceInfo(): DeviceInfo {
    const osType: PlatformType = toEnum(Platform.OS);
    const statusBarHeight: number = Platform.select({
        ios: isIphoneX() ? 44 : 20,
        android: getAndroidStatusBarHeight(),
        macos: 22, // most of the time..
        windows: 40,
        web: undefined
    });

    return { platformType: osType, statusBarHeight };
}

function toEnum(platformName: PlatformOSType): PlatformType {
    switch (platformName) {
        case "ios":
            return PlatformType.iOs;
        case "android":
            return PlatformType.Android;
        case "windows":
            return PlatformType.Windows;
        case "macos":
            return PlatformType.MacOs;
        case "web":
            return PlatformType.Web;
        default:
            throw "Unknown platform";
    }
}

function isIphoneX() {
    const d = Dimensions.get("window");
    if (Platform.OS === PlatformType.iOs) {
        const iOsPlatform = (Platform as PlatformIOSStatic);
        return !iOsPlatform.isPad && !iOsPlatform.isTVOS && ((d.height === 2436 && d.width === 1125) || (d.width === 2436 && d.height === 1125));
    }
    return false;
}

function getAndroidStatusBarHeight() {
    if (Platform.OS === PlatformType.Android) {
        return StatusBar.currentHeight;
    }
    return 0;
}