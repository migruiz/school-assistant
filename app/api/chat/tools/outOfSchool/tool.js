
import { z } from 'zod';
export const getOutOfSchoolTool = () => ({
    description: `This tool answers queries related to out of school activities, like childcare services (breakfast club) and after school programs like STEAM, chess, Dancing Clubs`,
    inputSchema: z.object({
        types: z.array(z.enum(["afterSchool", "childCare"])).describe('The type of out of school activity to search for. afterSchool: After School Activities like STEAM, chess, Dancing Clubs. childCare: Childcare services like breakfast club'),        
    }),
    execute: async ({ types }) => {
        let results = []
        if (types.includes("afterSchool")) {
            results.push("The school provides STEAM Microbit classes and Chess and Dancing Classes")
        }
        if (types.includes("childCare")) {
            results.push("Lily's Breakfast Club provides a safe and fun environment for children before school starts. Also they offer after school care until 6pm.")
        }
        return results.join(" /n")
    }
})