
import { z } from 'zod';
import {searchCalendar} from './schoolCalendarLLM'
export const getSchoolCalendarTool = ({openAIKey,schoolCalendar}) => ({
    description: `This tool answers queries related to the school year, opening/closing dates and times, finish/collection times, and if there are any event that changes the normal schedule.
        It can also provide information about upcoming school holidays (Mid-Term Break, Winter Break, Half Days, Early Finish, Early Collections, etc.) that may change the normal schedule.
        The tool expects a search date range as parameter. You need to convert any relative dates (today, tomorrow, next week) in the user query to absolute dates.
        Make sure to use the date range you choose falls into the School Year (2025-09-01 to 2026-06-26)
        The tool uses the search date range to search the school calendar`,
    inputSchema: z.object({
        fromDate: z.string().describe('The Start Date in this format YYYY-MM-DD'),
        toDate: z.string().describe('The End Date in this format YYYY-MM-DD'),
    }),
    execute: async ({ fromDate, toDate }) => await searchCalendar({ openAIKey, schoolCalendar, fromDate, toDate }),
})