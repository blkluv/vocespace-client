import { Button } from "antd";
import { SvgResource } from "../../pre_join/resources";


export function ScreenToggle(){
    return (
        <Button shape="circle" variant="solid" color="default" size="large">
            <SvgResource type="screen"></SvgResource>
        </Button>
    )
}