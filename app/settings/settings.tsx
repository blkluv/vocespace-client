import { Checkbox, Switch } from "antd";
import { SvgResource } from "../resources/svg";
import styles from "@/styles/settings.module.scss"

export function Settings(){


    return (
        <div className={styles.settings}>
            <div className={styles.settings_item}>
                <Checkbox></Checkbox>
                <SvgResource type="audio" svgSize={16}></SvgResource>
                <span>麦克风权限</span>
            </div>
            <div></div>
        </div>
    )
}