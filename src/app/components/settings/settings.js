import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from "../../../components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "../../../components/ui/alert-dialog"

import { Button } from "../../../components/ui/button"
import { Settings2, Bomb } from "lucide-react"
import { Input } from "../../../components/ui/input"
import { useEffect, useState } from "react"
import { useSettings } from "../../hooks/useSettings"

const Settings = () => {
    const { currentSettings, saveSettings } = useSettings()
    const [launchIDEcommandValue, setLaunchIDECommandValue] = useState(currentSettings.launchIDECommand)
    const [newSettings, setNewSettings] = useState(currentSettings)


    useEffect(() => {
        setNewSettings(prev => ({ ...prev, launchIDECommand: launchIDEcommandValue.trim() }))
    }, [launchIDEcommandValue])

    return (<Dialog>
        <DialogTrigger asChild>
            <Button className="p-2 bg-dark text-primary hover:bg-primary hover:text-black" size="icon"><Settings2 /></Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col justify-start">
                <span className="font-bold mb-1">Commands</span>
                <div>
                    <span>Launch IDE command</span>
                    <Input value={launchIDEcommandValue} onChange={e => setLaunchIDECommandValue(e.target.value)} />
                </div>

                <span className="mb-1">Debug</span>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <div>
                            <Button size="sm" variant="destructive">Clear stored data <Bomb/></Button>
                        </div>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                You are about to delete all stored data, continue?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => localStorage.clear()}>
                                Continue
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <div className="flex justify-end gap-2">
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={() => saveSettings(newSettings)}>Save</Button>
            </div>
        </DialogContent>
    </Dialog>)
}

export default Settings