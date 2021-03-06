'use strict';
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SECRET = 'DSFGSD453435sdgfhdfg%&¨*#¨$%#sdgfsd';

const {
    Model,
    Op
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Client extends Model {

        static associate(models) {
            this.hasMany(models.Account, {
                    as: "Accounts"
                }),
                this.hasMany(models.Loan, {
                    as: 'Loans'
                })
        }

        static async search(query) {
            const limit = query.limit ? parseInt(query.limit) : 20;
            const offset = query.offset ? parseInt(query.limit) : 0

            let where = {}

            if (query.name) where.name = {
                [Op.like]: `%${query.name}%` //filtrando pelo nome

            }
            if (query.email) where.email = q.query.email;

            const entities = await Client.findAndCountAll({
                where: {
                    //  TODO:    name: where,
                    state: {
                        [Op.like]: 1
                    }
                },

                limit: limit,
                offset: offset
            })

            return {
                entities: entities.rows,
                meta: {
                    count: entities.count,
                    limit: limit,
                    offset: offset
                }
            };
        }
        static async getId(id) {
            let items = await Client.findByPk(id, {
                include: [{
                        model: this.sequelize.models.Account,
                        as: "Accounts",
                    },
                    {
                        model: this.sequelize.models.Loan,
                        as: "Loans",
                    }


                ],

            })
            return items;
        }

        static async verifyLogin(email, password) {
            try {
                let client = await Client.findOne({
                    where: {
                        email: email
                    }
                });
                if (!client) {
                    throw new Error("Email nao enontrado");
                }
                if (!bcrypt.compareSync(password, client.password)) {
                    throw new Error("Senha nao confere");
                }

                //verificar se usuario esta logado
                let token = jwt.sign({
                    id: client.id
                }, SECRET, {
                    expiresIn: '1d'
                })

                return {
                    client: client,
                    token: token
                }
            } catch (error) {
                throw error;

            }

        }
        static async verifyToken(token) {
                return await jwt.verify(token, SECRET)
            }
            //sconde
        toJSON() {
            const values = Object.assign({}, this.get());
            delete values.password;
            return values;
        }

    };
    Client.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                is: {
                    args: [/^[A-Za-záàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ ]+$/],
                    msg: "O nome de conter apenas caracteres de A-Z"
                },
                len: {
                    args: [6, 20],
                    msg: "Nome: Minimo deve conter 6 caracteres"
                },
                contains: {
                    args: ' ',
                    msg: "Nome: deve conter espaco"
                },

                notNull: {
                    msg: "Nome: deve ser informado"
                }
            }
        },

        genre: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {

                isAlphanumeric: {

                    msg: "Genero: digite caracteres de A-Z"
                },
                len: {
                    args: [7, 10],
                    msg: "Genero: No minimo deve conter  7 caracteres"
                },
                notNull: {
                    msg: "Genero: deve ser informado"
                }
            }
        },
        pic: DataTypes.STRING,
        state: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            validate: {
                isIn: {
                    args: [
                        [
                            false, //
                            true, //Básico

                        ]
                    ],
                    msg: 'São aceitos apenas dois estados 0-Nao activo 1 - Activo,'
                }
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: {

                msg: "E-mail informado ja existe no sistema"
            },

            validate: {
                notNull: {
                    msg: " O E-mail dever informado"
                },
                isEmail: {
                    msg: "E-mail val"
                }
            }

        },
        password: {
            type: DataTypes.STRING,
            is: {
                args: ["^[a-z]+$", 'i'],
                msg: "Genero: digite caracteres de A-Z"
            },
            isAlphanumeric: true,
            allowNull: false,
            validate: {
                notNull: {
                    msg: "A senha dever informada"
                }
            }

        },
        isEmployee: {
            type: DataTypes.BOOLEAN,

            defaultValue: false,
            notNull: false,

        },
        bi: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,

            validate: {
                isAlphanumeric: {
                    msg: "BI: apenas letras e numeros"

                },

                notNull: {
                    msg: "BI: dever informado"
                }
            }

        },

        birthDate: {
            allowNull: false,
            type: DataTypes.DATE,
            validate: {
                notNull: {
                    msg: "Data de nascimento não pode ser null"
                },
                isDate: {
                    msg: "Data invalida"
                },
                isBefore: {
                    args: "2003-01-01",
                    msg: "Clientes devem ser apenas maiores de idade"
                }
            },

        },

        phone: {
            type: DataTypes.STRING,
            validate: {

                isNumeric: {

                    msg: "Telefone: digite caracteres de 1-9"
                },
                len: {
                    args: [9, 9],
                    msg: "Telefone  deve conter 9 caracteres"
                }
            }

        }
    }, {
        sequelize,
        modelName: 'Client',
        hooks: {
            beforeSave: (client, options) => {
                try {
                    bcrypt.getRounds(client.password)
                } catch (error) {
                    client.password = bcrypt.hashSync(client.password, 10)
                }
            }
        }
    });
    return Client;
};