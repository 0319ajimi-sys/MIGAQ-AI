export type QuestionType = 'checkbox' | 'radio' | 'rating-with-text' | 'textarea'

export interface Question {
  id: string
  number: number
  type: QuestionType
  text: string
  subtext?: string
  options?: string[]
  hasOtherOption?: boolean
}

export interface SurveyFormData {
  q1_purposes: string[]
  q1_other: string
  q2_satisfaction: number
  q2_reason: string
  q3_desired_services: string[]
  q3_other: string
  q4_zoom_participation: string
  q5_zoom_themes: string[]
  q5_other: string
  q6_cancellation_reasons: string[]
  q6_other: string
  q7_retention_services: string
  q8_feedback: string
}

export interface SurveyResponse extends SurveyFormData {
  id: string
  created_at: string
}

export interface ZoomParticipationStat {
  option: string
  count: number
  percentage: number
}

export interface RankingItem {
  item: string
  count: number
}

export interface AdminStats {
  totalResponses: number
  satisfactionAverage: number
  zoomParticipation: ZoomParticipationStat[]
  desiredServicesRanking: RankingItem[]
  cancellationReasonsRanking: RankingItem[]
  purposesRanking: RankingItem[]
}
