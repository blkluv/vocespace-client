import { Button } from "antd";
import { SvgResource } from "../../pre_join/resources";


export function VideoToggle(){
    return (
        <Button shape="circle" variant="solid" color="default" size="large">
            <SvgResource type="video"></SvgResource>
        </Button>
    )
}