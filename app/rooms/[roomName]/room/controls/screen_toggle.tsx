import { Button } from "antd";
import { SvgPreJoin } from "../../pre_join/resources";


export function ScreenToggle(){
    return (
        <Button shape="circle" variant="solid" color="default" size="large">
            <SvgPreJoin type="screen"></SvgPreJoin>
        </Button>
    )
}