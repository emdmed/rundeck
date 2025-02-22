"use client";

import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import ProcessCard from "./components/processCard"
import { LoaderCircle, Trash, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PathCard = ({ index, handleRemovePathCard, pathCard }) => {
    const [folderPath, setFolderPath] = useState("/home/enrique/projects");
    const [packageFiles, setPackageFiles] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [allActiveTerminals, setAllActiveTerminals] = useState()


    async function searchPackages(directory) {
        setIsLoading(true)
        const response = await fetch("/api/find-packages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ directory }),
        });

        const data = await response.json();
        setPackageFiles(data.packageJsonFiles)
        setIsLoading(false)
    }

    async function monitorTerminals() {

        const response = await fetch('/api/monitor-processes')

        const data = await response.json()

        setAllActiveTerminals(data.terminals)
    }

    const handleSearchPackages = async () => {
        const response = await searchPackages(folderPath)
        console.log("handleSearchPackages response", response)
    }

    const getFolderName = () => {
        try {
            const folderPathArray = folderPath.split("/")
            return folderPathArray[folderPathArray.length - 1]
        } catch (err) {
            console.log(err)
            return "Error"
        }
    }

    useEffect(() => {
        if(!folderPath) return
    }, [folderPath])

    useEffect(() => {
        monitorTerminals()
        const timer = setTimeout(() => {
            monitorTerminals()
        }, 5000);

        return () => clearTimeout(timer)
    }, [])

    return (
        <Card className="w-[30%] min-w-[500px] bg-stone-900">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    {packageFiles.length === 0 ? "Select directory" : "Process list"}
                    <Button onClick={() => handleRemovePathCard(pathCard)} disabled={index < 1} variant="ghost" size="sm" className="text-stone-200"><X /></Button>
                </CardTitle>
                <CardDescription>
                    {packageFiles.length === 0 ? "Directory absolute path where all your apps are (ex. projects, monorepo)" : "Run apps and servers from this list"}
                </CardDescription>
            </CardHeader>
            <CardContent className="h-max" style={{ overflow: "auto" }}>
                {isLoading && <div className="flex items-center justify-center w-full p-2">
                    <LoaderCircle className="spinner" /></div>}

                {!packageFiles && !isLoading && <div className="flex gap-2">
                    <Input onChange={e => setFolderPath(e.target.value)} value={folderPath} placeholder="Projects absolute path..." />
                    <Button onClick={handleSearchPackages} size="sm">Create</Button>
                </div>}

                {packageFiles && !isLoading && <div className="flex items-center justify-between">
                    <Badge>{"./"}{getFolderName()}</Badge>
                    <Button onClick={() => setPackageFiles(false)} variant="ghost" size="sm" className="text-stone-200"><Trash /></Button>
                </div>}
                {packageFiles && packageFiles.map(packageFile => {
                    return <ProcessCard allActiveTerminals={allActiveTerminals} key={packageFile.filePath} packageFile={packageFile} />
                })}

            </CardContent>
        </Card>
    );
};

export default PathCard;
