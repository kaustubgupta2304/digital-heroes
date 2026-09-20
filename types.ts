export type Profile = { id:string; full_name:string|null; role:'subscriber'|'admin'; subscription_status:'active'|'inactive'|'past_due'; renewal_date:string|null; charity_id:string|null; charity_percent:number };
export type Charity = { id:string; name:string; slug:string; description:string; image_url:string|null; events:string|null; featured:boolean };
export type Score = { id:string; user_id:string; score:number; score_date:string; created_at:string };
export type Draw = { id:string; draw_month:string; draw_numbers:number[]; draw_type:'random'|'algorithmic'; status:'draft'|'published'; prize_pool:number; jackpot_rollover:number; created_at:string };
