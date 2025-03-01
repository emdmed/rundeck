import { Badge } from "../../components/ui/badge"
import Socials from "./socials"

const VersionTag = () => {

    const version = "v0.5.2"

    return <div className="opacity-50">
        <div className="flex items-center gap-2">
            <Socials />
            <Badge
                variant="outline"
            >{version}</Badge>
        </div>
    </div>
}

export default VersionTag