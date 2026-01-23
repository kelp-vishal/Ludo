import { Column, Table, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'users',
  schema: 'public',
  timestamps: false,
})
export class User {
  @Column({
    field: 'id',
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    field: 'username',
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  username: string;

  @Column({
    field: 'email',
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  email: string;

  @Column({
    field: 'password',
    type: DataType.STRING,
    allowNull: false,
  })
  password: string;
}
