import { Entity, EntityState } from "@app/shared";

export interface UserState extends EntityState {}

export class User extends Entity<UserState> {
  constructor(props: UserState) {
    super(props);
  }

  validate(): void {
    // Placeholder intencional para futuras validacoes do agregado.
  }
}
