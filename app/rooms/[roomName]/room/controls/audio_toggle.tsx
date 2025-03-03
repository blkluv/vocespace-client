import { Button } from "antd";
import { SvgPreJoin } from "../../pre_join/resources";


export function AudioToggle(){
    return (
        <Button shape="circle" variant="solid" color="default" size="large">
            <SvgPreJoin type="audio"></SvgPreJoin>
        </Button>
    )
}