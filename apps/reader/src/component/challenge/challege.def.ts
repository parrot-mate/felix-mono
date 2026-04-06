export enum ChallengeState {
  Init,
  Starting,
  Started,
}

export interface ChallengeProps {
  state: ChallengeState
  setState: (state: ChallengeState) => void
}
