
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "account_sanctions": {
                  Row: {
                    "created_at": string,"created_by": string,"id": string,"kind": Database["public"]['Enums']["sanction_kind"],"lifted_at": string | null,"lifted_by": string | null,"profile_id": string,"reason": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by": string,"id"?: string,"kind": Database["public"]['Enums']["sanction_kind"],"lifted_at"?: string | null,"lifted_by"?: string | null,"profile_id": string,"reason": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["sanction_kind"],"lifted_at"?: string | null,"lifted_by"?: string | null,"profile_id"?: string,"reason"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "account_sanctions_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "account_sanctions_lifted_by_fkey"
      columns: ["lifted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "account_sanctions_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"admin_roles": {
                  Row: {
                    "created_at": string,"created_by": string | null,"role": Database["public"]['Enums']["staff_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"role": Database["public"]['Enums']["staff_role"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"role"?: Database["public"]['Enums']["staff_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "admin_roles_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "admin_roles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"blocks": {
                  Row: {
                    "blocked_id": string,"blocker_id": string,"created_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "blocked_id": string,"blocker_id": string,"created_at"?: string
                  }
                  Update: {
                    "blocked_id"?: string,"blocker_id"?: string,"created_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "blocks_blocked_id_fkey"
      columns: ["blocked_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "blocks_blocker_id_fkey"
      columns: ["blocker_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"build_log_follows": {
                  Row: {
                    "build_log_id": string,"created_at": string,"profile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "build_log_id": string,"created_at"?: string,"profile_id": string
                  }
                  Update: {
                    "build_log_id"?: string,"created_at"?: string,"profile_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "build_log_follows_build_log_id_fkey"
      columns: ["build_log_id"]
isOneToOne: false
      referencedRelation: "build_logs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "build_log_follows_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"build_logs": {
                  Row: {
                    "author_id": string,"content": string,"created_at": string,"id": string,"kind": Database["public"]['Enums']["build_log_kind"],"media_urls": (string)[],"project_id": string,"removed_at": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"content": string,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["build_log_kind"],"media_urls"?: (string)[],"project_id": string,"removed_at"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string,"content"?: string,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["build_log_kind"],"media_urls"?: (string)[],"project_id"?: string,"removed_at"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "build_logs_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "build_logs_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"comments": {
                  Row: {
                    "author_id": string,"content": string,"created_at": string,"id": string,"parent_comment_id": string | null,"post_id": string,"removed_at": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"content": string,"created_at"?: string,"id"?: string,"parent_comment_id"?: string | null,"post_id": string,"removed_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string,"content"?: string,"created_at"?: string,"id"?: string,"parent_comment_id"?: string | null,"post_id"?: string,"removed_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_parent_comment_id_fkey"
      columns: ["parent_comment_id"]
isOneToOne: false
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                },"communities": {
                  Row: {
                    "avatar_url": string | null,"category": Database["public"]['Enums']["community_category"],"created_at": string,"created_by": string,"description": string,"id": string,"is_demo": boolean,"name": string,"removed_at": string | null,"slug": string,"updated_at": string,"visibility": Database["public"]['Enums']["visibility"]
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"category": Database["public"]['Enums']["community_category"],"created_at"?: string,"created_by": string,"description": string,"id"?: string,"is_demo"?: boolean,"name": string,"removed_at"?: string | null,"slug": string,"updated_at"?: string,"visibility"?: Database["public"]['Enums']["visibility"]
                  }
                  Update: {
                    "avatar_url"?: string | null,"category"?: Database["public"]['Enums']["community_category"],"created_at"?: string,"created_by"?: string,"description"?: string,"id"?: string,"is_demo"?: boolean,"name"?: string,"removed_at"?: string | null,"slug"?: string,"updated_at"?: string,"visibility"?: Database["public"]['Enums']["visibility"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "communities_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"community_members": {
                  Row: {
                    "community_id": string,"joined_at": string,"profile_id": string,"role": Database["public"]['Enums']["community_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "community_id": string,"joined_at"?: string,"profile_id": string,"role": Database["public"]['Enums']["community_role"]
                  }
                  Update: {
                    "community_id"?: string,"joined_at"?: string,"profile_id"?: string,"role"?: Database["public"]['Enums']["community_role"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "community_members_community_id_fkey"
      columns: ["community_id"]
isOneToOne: false
      referencedRelation: "communities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "community_members_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"community_posts": {
                  Row: {
                    "community_id": string,"created_at": string,"post_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "community_id": string,"created_at"?: string,"post_id": string
                  }
                  Update: {
                    "community_id"?: string,"created_at"?: string,"post_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "community_posts_community_id_fkey"
      columns: ["community_id"]
isOneToOne: false
      referencedRelation: "communities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "community_posts_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    }
                  ]
                },"contribution_requests": {
                  Row: {
                    "created_at": string,"id": string,"message": string,"project_id": string,"proposed_contribution": string,"requester_id": string,"status": Database["public"]['Enums']["contribution_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"message": string,"project_id": string,"proposed_contribution": string,"requester_id": string,"status"?: Database["public"]['Enums']["contribution_status"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"message"?: string,"project_id"?: string,"proposed_contribution"?: string,"requester_id"?: string,"status"?: Database["public"]['Enums']["contribution_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "contribution_requests_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contribution_requests_requester_id_fkey"
      columns: ["requester_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"feed_events": {
                  Row: {
                    "created_at": string,"event_type": Database["public"]['Enums']["feed_event_type"],"id": string,"post_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"event_type": Database["public"]['Enums']["feed_event_type"],"id"?: string,"post_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"event_type"?: Database["public"]['Enums']["feed_event_type"],"id"?: string,"post_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "feed_events_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "feed_events_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"follows": {
                  Row: {
                    "created_at": string,"follower_id": string,"following_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"follower_id": string,"following_id": string
                  }
                  Update: {
                    "created_at"?: string,"follower_id"?: string,"following_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "follows_follower_id_fkey"
      columns: ["follower_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "follows_following_id_fkey"
      columns: ["following_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"hidden_posts": {
                  Row: {
                    "created_at": string,"post_id": string,"profile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"post_id": string,"profile_id": string
                  }
                  Update: {
                    "created_at"?: string,"post_id"?: string,"profile_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "hidden_posts_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "hidden_posts_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"interests": {
                  Row: {
                    "category": string,"id": string,"name": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"id"?: string,"name": string,"slug": string
                  }
                  Update: {
                    "category"?: string,"id"?: string,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"notifications": {
                  Row: {
                    "actor_id": string | null,"comment_id": string | null,"community_id": string | null,"created_at": string,"id": string,"message": string,"post_id": string | null,"project_id": string | null,"read_at": string | null,"recipient_id": string,"type": Database["public"]['Enums']["notification_type"]
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"comment_id"?: string | null,"community_id"?: string | null,"created_at"?: string,"id"?: string,"message": string,"post_id"?: string | null,"project_id"?: string | null,"read_at"?: string | null,"recipient_id": string,"type": Database["public"]['Enums']["notification_type"]
                  }
                  Update: {
                    "actor_id"?: string | null,"comment_id"?: string | null,"community_id"?: string | null,"created_at"?: string,"id"?: string,"message"?: string,"post_id"?: string | null,"project_id"?: string | null,"read_at"?: string | null,"recipient_id"?: string,"type"?: Database["public"]['Enums']["notification_type"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_comment_id_fkey"
      columns: ["comment_id"]
isOneToOne: false
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_community_id_fkey"
      columns: ["community_id"]
isOneToOne: false
      referencedRelation: "communities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"opportunities": {
                  Row: {
                    "category": Database["public"]['Enums']["opportunity_category"],"country": string | null,"created_at": string,"created_by": string,"deadline": string | null,"description": string,"eligibility": string | null,"id": string,"image_url": string | null,"is_demo": boolean,"is_online": boolean,"is_published": boolean,"is_verified": boolean,"location": string | null,"max_age": number | null,"min_age": number | null,"official_url": string,"organizer": string,"prize": string | null,"removed_at": string | null,"slug": string,"start_date": string | null,"state": string | null,"team_size_max": number | null,"team_size_min": number | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category": Database["public"]['Enums']["opportunity_category"],"country"?: string | null,"created_at"?: string,"created_by": string,"deadline"?: string | null,"description": string,"eligibility"?: string | null,"id"?: string,"image_url"?: string | null,"is_demo"?: boolean,"is_online"?: boolean,"is_published"?: boolean,"is_verified"?: boolean,"location"?: string | null,"max_age"?: number | null,"min_age"?: number | null,"official_url": string,"organizer": string,"prize"?: string | null,"removed_at"?: string | null,"slug": string,"start_date"?: string | null,"state"?: string | null,"team_size_max"?: number | null,"team_size_min"?: number | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "category"?: Database["public"]['Enums']["opportunity_category"],"country"?: string | null,"created_at"?: string,"created_by"?: string,"deadline"?: string | null,"description"?: string,"eligibility"?: string | null,"id"?: string,"image_url"?: string | null,"is_demo"?: boolean,"is_online"?: boolean,"is_published"?: boolean,"is_verified"?: boolean,"location"?: string | null,"max_age"?: number | null,"min_age"?: number | null,"official_url"?: string,"organizer"?: string,"prize"?: string | null,"removed_at"?: string | null,"slug"?: string,"start_date"?: string | null,"state"?: string | null,"team_size_max"?: number | null,"team_size_min"?: number | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "opportunities_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"opportunity_saves": {
                  Row: {
                    "created_at": string,"opportunity_id": string,"profile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"opportunity_id": string,"profile_id": string
                  }
                  Update: {
                    "created_at"?: string,"opportunity_id"?: string,"profile_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "opportunity_saves_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "opportunities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunity_saves_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"opportunity_skills": {
                  Row: {
                    "opportunity_id": string,"skill_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "opportunity_id": string,"skill_id": string
                  }
                  Update: {
                    "opportunity_id"?: string,"skill_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "opportunity_skills_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "opportunities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunity_skills_skill_id_fkey"
      columns: ["skill_id"]
isOneToOne: false
      referencedRelation: "skills"
      referencedColumns: ["id"]
    }
                  ]
                },"posts": {
                  Row: {
                    "author_id": string,"build_log_id": string | null,"content": string,"created_at": string,"id": string,"is_demo": boolean,"link_url": string | null,"media_urls": (string)[],"opportunity_id": string | null,"project_id": string | null,"removed_at": string | null,"title": string | null,"type": Database["public"]['Enums']["post_type"],"updated_at": string,"visibility": Database["public"]['Enums']["visibility"]
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"build_log_id"?: string | null,"content": string,"created_at"?: string,"id"?: string,"is_demo"?: boolean,"link_url"?: string | null,"media_urls"?: (string)[],"opportunity_id"?: string | null,"project_id"?: string | null,"removed_at"?: string | null,"title"?: string | null,"type": Database["public"]['Enums']["post_type"],"updated_at"?: string,"visibility"?: Database["public"]['Enums']["visibility"]
                  }
                  Update: {
                    "author_id"?: string,"build_log_id"?: string | null,"content"?: string,"created_at"?: string,"id"?: string,"is_demo"?: boolean,"link_url"?: string | null,"media_urls"?: (string)[],"opportunity_id"?: string | null,"project_id"?: string | null,"removed_at"?: string | null,"title"?: string | null,"type"?: Database["public"]['Enums']["post_type"],"updated_at"?: string,"visibility"?: Database["public"]['Enums']["visibility"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_build_log_id_fkey"
      columns: ["build_log_id"]
isOneToOne: true
      referencedRelation: "build_logs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: true
      referencedRelation: "opportunities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "posts_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_awards": {
                  Row: {
                    "created_at": string,"id": string,"image_url": string | null,"issuer": string,"profile_id": string,"title": string,"verified_at": string | null,"year": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"image_url"?: string | null,"issuer": string,"profile_id": string,"title": string,"verified_at"?: string | null,"year"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"image_url"?: string | null,"issuer"?: string,"profile_id"?: string,"title"?: string,"verified_at"?: string | null,"year"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_awards_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_certificates": {
                  Row: {
                    "created_at": string,"credential_url": string | null,"id": string,"image_url": string | null,"issuer": string,"name": string,"profile_id": string,"verified_at": string | null,"year": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"credential_url"?: string | null,"id"?: string,"image_url"?: string | null,"issuer": string,"name": string,"profile_id": string,"verified_at"?: string | null,"year"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"credential_url"?: string | null,"id"?: string,"image_url"?: string | null,"issuer"?: string,"name"?: string,"profile_id"?: string,"verified_at"?: string | null,"year"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_certificates_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_communities": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"profile_id": string,"role": string | null,"year": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"profile_id": string,"role"?: string | null,"year"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"profile_id"?: string,"role"?: string | null,"year"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_communities_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_competitions": {
                  Row: {
                    "created_at": string,"host": string | null,"id": string,"name": string,"profile_id": string,"result": string | null,"url": string | null,"year": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"host"?: string | null,"id"?: string,"name": string,"profile_id": string,"result"?: string | null,"url"?: string | null,"year"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"host"?: string | null,"id"?: string,"name"?: string,"profile_id"?: string,"result"?: string | null,"url"?: string | null,"year"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_competitions_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_education": {
                  Row: {
                    "created_at": string,"credential": string | null,"end_year": number | null,"id": string,"profile_id": string,"school": string,"start_year": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"credential"?: string | null,"end_year"?: number | null,"id"?: string,"profile_id": string,"school": string,"start_year"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"credential"?: string | null,"end_year"?: number | null,"id"?: string,"profile_id"?: string,"school"?: string,"start_year"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_education_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_experience": {
                  Row: {
                    "created_at": string,"end_year": number | null,"id": string,"organization": string,"profile_id": string,"start_year": number | null,"summary": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"end_year"?: number | null,"id"?: string,"organization": string,"profile_id": string,"start_year"?: number | null,"summary"?: string | null,"title": string
                  }
                  Update: {
                    "created_at"?: string,"end_year"?: number | null,"id"?: string,"organization"?: string,"profile_id"?: string,"start_year"?: number | null,"summary"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_experience_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_interests": {
                  Row: {
                    "created_at": string,"interest_id": string,"profile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"interest_id": string,"profile_id": string
                  }
                  Update: {
                    "created_at"?: string,"interest_id"?: string,"profile_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_interests_interest_id_fkey"
      columns: ["interest_id"]
isOneToOne: false
      referencedRelation: "interests"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profile_interests_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_links": {
                  Row: {
                    "created_at": string,"id": string,"label": string,"profile_id": string,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"label": string,"profile_id": string,"url": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"label"?: string,"profile_id"?: string,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_links_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_private": {
                  Row: {
                    "created_at": string,"onboarding_step": number,"profile_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"onboarding_step"?: number,"profile_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"onboarding_step"?: number,"profile_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_private_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_publications": {
                  Row: {
                    "created_at": string,"id": string,"profile_id": string,"summary": string | null,"title": string,"url": string | null,"venue": string | null,"year": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"profile_id": string,"summary"?: string | null,"title": string,"url"?: string | null,"venue"?: string | null,"year"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"profile_id"?: string,"summary"?: string | null,"title"?: string,"url"?: string | null,"venue"?: string | null,"year"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_publications_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_sections": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"profile_id": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"profile_id": string,"title": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"profile_id"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_sections_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_skills": {
                  Row: {
                    "created_at": string,"proficiency": number | null,"profile_id": string,"skill_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"proficiency"?: number | null,"profile_id": string,"skill_id": string
                  }
                  Update: {
                    "created_at"?: string,"proficiency"?: number | null,"profile_id"?: string,"skill_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_skills_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profile_skills_skill_id_fkey"
      columns: ["skill_id"]
isOneToOne: false
      referencedRelation: "skills"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "age_group": Database["public"]['Enums']["age_group"] | null,"avatar_url": string | null,"banner_url": string | null,"bio": string | null,"city": string | null,"collaboration_preference": Database["public"]['Enums']["collaboration_type"] | null,"country": string,"created_at": string,"deleted_at": string | null,"display_name": string,"education": string | null,"github_username": string | null,"id": string,"is_demo": boolean,"looking_for": (string)[],"onboarding_complete": boolean,"notify_follows": boolean,"state": string | null,"updated_at": string,"username": string | null,"visibility": Database["public"]['Enums']["visibility"],"website_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "age_group"?: Database["public"]['Enums']["age_group"] | null,"avatar_url"?: string | null,"banner_url"?: string | null,"bio"?: string | null,"city"?: string | null,"collaboration_preference"?: Database["public"]['Enums']["collaboration_type"] | null,"country"?: string,"created_at"?: string,"deleted_at"?: string | null,"display_name": string,"education"?: string | null,"github_username"?: string | null,"id": string,"is_demo"?: boolean,"looking_for"?: (string)[],"onboarding_complete"?: boolean,"notify_follows"?: boolean,"state"?: string | null,"updated_at"?: string,"username"?: string | null,"visibility"?: Database["public"]['Enums']["visibility"],"website_url"?: string | null
                  }
                  Update: {
                    "age_group"?: Database["public"]['Enums']["age_group"] | null,"avatar_url"?: string | null,"banner_url"?: string | null,"bio"?: string | null,"city"?: string | null,"collaboration_preference"?: Database["public"]['Enums']["collaboration_type"] | null,"country"?: string,"created_at"?: string,"deleted_at"?: string | null,"display_name"?: string,"education"?: string | null,"github_username"?: string | null,"id"?: string,"is_demo"?: boolean,"looking_for"?: (string)[],"onboarding_complete"?: boolean,"notify_follows"?: boolean,"state"?: string | null,"updated_at"?: string,"username"?: string | null,"visibility"?: Database["public"]['Enums']["visibility"],"website_url"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"project_discussion": {
                  Row: {
                    "author_id": string,"body": string,"created_at": string,"id": string,"project_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"body": string,"created_at"?: string,"id"?: string,"project_id": string
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"created_at"?: string,"id"?: string,"project_id"?: string
                  }
                  Relationships: []
                },"project_follows": {
                  Row: {
                    "created_at": string,"profile_id": string,"project_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"profile_id": string,"project_id": string
                  }
                  Update: {
                    "created_at"?: string,"profile_id"?: string,"project_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_follows_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_follows_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_saves": {
                  Row: {
                    "created_at": string,"profile_id": string,"project_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"profile_id": string,"project_id": string
                  }
                  Update: {
                    "created_at"?: string,"profile_id"?: string,"project_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_saves_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_saves_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_versions": {
                  Row: {
                    "created_at": string,"id": string,"note": string | null,"project_id": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"note"?: string | null,"project_id": string,"title": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"note"?: string | null,"project_id"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_versions_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_gallery": {
                  Row: {
                    "created_at": string,"id": string,"image_url": string,"project_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"image_url": string,"project_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"image_url"?: string,"project_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_gallery_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_milestones": {
                  Row: {
                    "created_at": string,"happens_on": string,"id": string,"major": boolean,"project_id": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"happens_on": string,"id"?: string,"major"?: boolean,"project_id": string,"title": string
                  }
                  Update: {
                    "created_at"?: string,"happens_on"?: string,"id"?: string,"major"?: boolean,"project_id"?: string,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_milestones_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"collections": {
                  Row: {
                    "created_at": string,"id": string,"owner_id": string,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"owner_id": string,"title": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"owner_id"?: string,"title"?: string
                  }
                  Relationships: []
                },"collection_projects": {
                  Row: {
                    "collection_id": string,"created_at": string,"project_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "collection_id": string,"created_at"?: string,"project_id": string
                  }
                  Update: {
                    "collection_id"?: string,"created_at"?: string,"project_id"?: string
                  }
                  Relationships: []
                },"mutes": {
                  Row: {
                    "created_at": string,"muted_id": string,"profile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"muted_id": string,"profile_id": string
                  }
                  Update: {
                    "created_at"?: string,"muted_id"?: string,"profile_id"?: string
                  }
                  Relationships: []
                },"profile_session_floor": {
                  Row: {
                    "profile_id": string,"valid_after": string
                  }
                  ComputedFields: never
                  Insert: {
                    "profile_id": string,"valid_after": string
                  }
                  Update: {
                    "profile_id"?: string,"valid_after"?: string
                  }
                  Relationships: []
                },"project_invites": {
                  Row: {
                    "created_at": string,"id": string,"invited_by": string,"invitee_id": string,"project_id": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"invited_by": string,"invitee_id": string,"project_id": string,"status"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"invited_by"?: string,"invitee_id"?: string,"project_id"?: string,"status"?: string
                  }
                  Relationships: []
                },"project_members": {
                  Row: {
                    "created_at": string,"id": string,"joined_at": string | null,"profile_id": string,"project_id": string,"role": Database["public"]['Enums']["member_role"],"status": Database["public"]['Enums']["member_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"joined_at"?: string | null,"profile_id": string,"project_id": string,"role": Database["public"]['Enums']["member_role"],"status": Database["public"]['Enums']["member_status"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"joined_at"?: string | null,"profile_id"?: string,"project_id"?: string,"role"?: Database["public"]['Enums']["member_role"],"status"?: Database["public"]['Enums']["member_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_members_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_members_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_pull_requests": {
                  Row: {
                    "author_id": string,"body": string,"created_at": string,"id": string,"proposed_description": string,"source_project_id": string,"status": string,"target_project_id": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"body": string,"created_at"?: string,"id"?: string,"proposed_description": string,"source_project_id": string,"status"?: string,"target_project_id": string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"created_at"?: string,"id"?: string,"proposed_description"?: string,"source_project_id"?: string,"status"?: string,"target_project_id"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_pull_requests_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_pull_requests_source_project_id_fkey"
      columns: ["source_project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_pull_requests_target_project_id_fkey"
      columns: ["target_project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_skills": {
                  Row: {
                    "project_id": string,"relation": Database["public"]['Enums']["skill_relation"],"skill_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "project_id": string,"relation": Database["public"]['Enums']["skill_relation"],"skill_id": string
                  }
                  Update: {
                    "project_id"?: string,"relation"?: Database["public"]['Enums']["skill_relation"],"skill_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_skills_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_skills_skill_id_fkey"
      columns: ["skill_id"]
isOneToOne: false
      referencedRelation: "skills"
      referencedColumns: ["id"]
    }
                  ]
                },"projects": {
                  Row: {
                    "category": string,"collaboration_type": Database["public"]['Enums']["collaboration_type"] | null,"cover_image_url": string | null,"created_at": string,"demo_url": string | null,"description": string,"detailed_description": string | null,"credits": string | null,"documentation_url": string | null,"featured_at": string | null,"profile_featured_at": string | null,"github_url": string | null,"id": string,"is_demo": boolean,"looking_for_contributors": boolean,"teammate_requirement": string | null,"teammate_responsibilities": string | null,"time_commitment": string | null,"name": string,"owner_id": string,"parent_project_id": string | null,"problem": string | null,"removed_at": string | null,"slug": string,"solution": string | null,"starts_on": string | null,"ends_on": string | null,"status": Database["public"]['Enums']["project_status"],"subcategory": string | null,"tagline": string | null,"updated_at": string,"visibility": Database["public"]['Enums']["visibility"]
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"collaboration_type"?: Database["public"]['Enums']["collaboration_type"] | null,"cover_image_url"?: string | null,"created_at"?: string,"demo_url"?: string | null,"description": string,"detailed_description"?: string | null,"credits"?: string | null,"documentation_url"?: string | null,"featured_at"?: string | null,"profile_featured_at"?: string | null,"github_url"?: string | null,"id"?: string,"is_demo"?: boolean,"looking_for_contributors"?: boolean,"teammate_requirement"?: string | null,"teammate_responsibilities"?: string | null,"time_commitment"?: string | null,"name": string,"owner_id": string,"parent_project_id"?: string | null,"problem"?: string | null,"removed_at"?: string | null,"slug": string,"solution"?: string | null,"starts_on"?: string | null,"ends_on"?: string | null,"status"?: Database["public"]['Enums']["project_status"],"subcategory"?: string | null,"tagline"?: string | null,"updated_at"?: string,"visibility"?: Database["public"]['Enums']["visibility"]
                  }
                  Update: {
                    "category"?: string,"collaboration_type"?: Database["public"]['Enums']["collaboration_type"] | null,"cover_image_url"?: string | null,"created_at"?: string,"demo_url"?: string | null,"description"?: string,"detailed_description"?: string | null,"credits"?: string | null,"documentation_url"?: string | null,"featured_at"?: string | null,"profile_featured_at"?: string | null,"github_url"?: string | null,"id"?: string,"is_demo"?: boolean,"looking_for_contributors"?: boolean,"teammate_requirement"?: string | null,"teammate_responsibilities"?: string | null,"time_commitment"?: string | null,"name"?: string,"owner_id"?: string,"parent_project_id"?: string | null,"problem"?: string | null,"removed_at"?: string | null,"slug"?: string,"solution"?: string | null,"starts_on"?: string | null,"ends_on"?: string | null,"status"?: Database["public"]['Enums']["project_status"],"subcategory"?: string | null,"tagline"?: string | null,"updated_at"?: string,"visibility"?: Database["public"]['Enums']["visibility"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "projects_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_parent_project_id_fkey"
      columns: ["parent_project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"reactions": {
                  Row: {
                    "created_at": string,"id": string,"post_id": string,"type": Database["public"]['Enums']["reaction_type"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"post_id": string,"type": Database["public"]['Enums']["reaction_type"],"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"post_id"?: string,"type"?: Database["public"]['Enums']["reaction_type"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reactions_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reactions_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reposts": {
                  Row: {
                    "created_at": string,"id": string,"post_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"post_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"post_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reposts_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reposts_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reports": {
                  Row: {
                    "comment_id": string | null,"created_at": string,"description": string | null,"id": string,"opportunity_id": string | null,"post_id": string | null,"profile_id": string | null,"project_id": string | null,"reason": Database["public"]['Enums']["report_reason"],"reporter_id": string,"resolution_note": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"status": Database["public"]['Enums']["report_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "comment_id"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"opportunity_id"?: string | null,"post_id"?: string | null,"profile_id"?: string | null,"project_id"?: string | null,"reason": Database["public"]['Enums']["report_reason"],"reporter_id": string,"resolution_note"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: Database["public"]['Enums']["report_status"]
                  }
                  Update: {
                    "comment_id"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"opportunity_id"?: string | null,"post_id"?: string | null,"profile_id"?: string | null,"project_id"?: string | null,"reason"?: Database["public"]['Enums']["report_reason"],"reporter_id"?: string,"resolution_note"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: Database["public"]['Enums']["report_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "reports_comment_id_fkey"
      columns: ["comment_id"]
isOneToOne: false
      referencedRelation: "comments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reports_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"saves": {
                  Row: {
                    "created_at": string,"id": string,"post_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"post_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"post_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "saves_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "saves_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"skills": {
                  Row: {
                    "category": string,"created_at": string,"id": string,"name": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"created_at"?: string,"id"?: string,"name": string,"slug": string
                  }
                  Update: {
                    "category"?: string,"created_at"?: string,"id"?: string,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "profile_directory": {
              Row: {
                "age_group": Database["public"]['Enums']["age_group"] | null
                "avatar_url": string | null
                "banner_url": string | null
                "bio": string | null
                "city": string | null
                "collaboration_preference": Database["public"]['Enums']["collaboration_type"] | null
                "deleted_at": string | null
                "display_name": string
                "education": string | null
                "github_username": string | null
                "id": string
                "looking_for": string[]
                "onboarding_complete": boolean
                "state": string | null
                "username": string | null
                "visibility": Database["public"]['Enums']["visibility"]
                "website_url": string | null
              }
              Relationships: []
            }
          }
          Functions: {
            "anonymize_profile":
{ Args: { "target": string }; Returns: undefined
                           },
"owner_project_save_count":
{ Args: { "target": string }; Returns: number
                           },
"current_member_status":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"show_limit":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"show_trgm":
{ Args: { "": string }; Returns: (string)[]
                           }
          }
          Enums: {
            "age_group": "13_15"|"16_17"|"18_24"|"25_34"|"35_plus","build_log_kind": "update"|"milestone"|"problem"|"experiment"|"lesson"|"explanation","collaboration_type": "remote"|"local"|"hybrid","community_category": "technology"|"discipline"|"city"|"institution"|"research"|"project","community_role": "owner"|"moderator"|"member","contribution_status": "pending"|"accepted"|"rejected"|"withdrawn","feed_event_type": "impression"|"dismiss"|"more"|"less","member_role": "owner"|"maintainer"|"contributor","member_status": "pending"|"active"|"rejected","notification_type": "new_follower"|"comment"|"reply"|"contribution_request"|"contribution_accepted"|"contribution_rejected"|"project_update"|"community_activity","opportunity_category": "hackathon"|"robotics_competition"|"science_fair"|"research_program"|"olympiad"|"scholarship"|"fellowship"|"internship"|"grant"|"maker_event"|"startup_competition"|"innovation_challenge"|"workshop"|"conference"|"startup_program"|"incubator"|"open_source"|"volunteering"|"mentorship","post_type": "project"|"build_log"|"idea"|"help"|"achievement"|"opportunity","project_status": "idea"|"researching"|"in_development"|"prototype"|"testing"|"completed"|"on_hold","reaction_type": "interesting"|"inspired"|"build"|"contribute"|"like"|"upvote"|"downvote","report_reason": "harassment"|"spam"|"inappropriate"|"impersonation"|"unsafe"|"copyright"|"other"|"outdated"|"misleading","report_status": "open"|"reviewing"|"removed"|"dismissed"|"restored","sanction_kind": "suspension","skill_relation": "uses"|"seeking","staff_role": "admin"|"moderator","visibility": "public"|"private"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "age_group": ["13_15", "16_17", "18_24", "25_34", "35_plus"],"build_log_kind": ["update", "milestone", "problem", "experiment", "lesson", "explanation"],"collaboration_type": ["remote", "local", "hybrid"],"community_category": ["technology", "discipline", "city", "institution", "research", "project"],"community_role": ["owner", "moderator", "member"],"contribution_status": ["pending", "accepted", "rejected", "withdrawn"],"feed_event_type": ["impression", "dismiss", "more", "less"],"member_role": ["owner", "maintainer", "contributor"],"member_status": ["pending", "active", "rejected"],"notification_type": ["new_follower", "comment", "reply", "contribution_request", "contribution_accepted", "contribution_rejected", "project_update", "community_activity"],"opportunity_category": ["hackathon", "robotics_competition", "science_fair", "research_program", "olympiad", "scholarship", "fellowship", "internship", "grant", "maker_event", "startup_competition", "innovation_challenge", "workshop", "conference", "startup_program", "incubator", "open_source", "volunteering", "mentorship"],"post_type": ["project", "build_log", "idea", "help", "achievement", "opportunity"],"project_status": ["idea", "researching", "in_development", "prototype", "testing", "completed", "on_hold"],"reaction_type": ["interesting", "inspired", "build", "contribute", "like", "upvote", "downvote"],"report_reason": ["harassment", "spam", "inappropriate", "impersonation", "unsafe", "copyright", "other", "outdated", "misleading"],"report_status": ["open", "reviewing", "removed", "dismissed", "restored"],"sanction_kind": ["suspension"],"skill_relation": ["uses", "seeking"],"staff_role": ["admin", "moderator"],"visibility": ["public", "private"]
          }
        }
} as const
