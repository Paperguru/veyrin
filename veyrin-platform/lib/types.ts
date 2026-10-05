export type Course = { id:string; slug:string; title:string; description:string; role:string; level:string; duration:string; price:number; featured:boolean; cover_emoji:string; published:boolean; lessons?:number; };
export type Question = { id:string; category:string; role:string; difficulty:string; question:string; answer?:string; tags?:string[]; };
