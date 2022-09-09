import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>
  ) { }

  async create(createPokemonDto: CreatePokemonDto) {

    createPokemonDto.name = createPokemonDto.name.toLowerCase();

    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      this.handleException(error)
    }

  }

  async findAll() {
    let pokemons: Pokemon[];

    pokemons = await this.pokemonModel.find();
    return pokemons;
  }

  async findOne(id: string) {
    let pokemon: Pokemon;

    // verificar si lo que se manda es un numero 
    if (!isNaN(+id)) {
      pokemon = await this.pokemonModel.findOne({ no: id })
    }

    //verificar si lo que se manda es un mongoID
    if (!pokemon && isValidObjectId(id)) {
      pokemon = await this.pokemonModel.findById(id)
    }

    // verificar si lo que se manda es el nombre
    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({ name: id.toLowerCase().trim() })
    }

    // verificar si el pokemon no existe en la bd 
    if (!pokemon) {
      throw new NotFoundException(`El pokemon con id, nombre o numero: ${id} no existe`)
    }
    return pokemon;
  }

  async update(id: string, updatePokemonDto: UpdatePokemonDto) {

    const pokemon = await this.findOne(id);

    if (updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    }

    try {
      await pokemon.updateOne(updatePokemonDto, { new: true })

      return { ...pokemon.toJSON(), ...updatePokemonDto };
    } catch (error) {
      this.handleException(error)
    }


  }

  async remove(id: string) {
   
    // const pokemon = await this.findOne(id)
    // await pokemon.deleteOne();
    // const res = await this.pokemonModel.findByIdAndDelete(id)

    const {deletedCount} = await this.pokemonModel.deleteOne({_id: id})

    if(deletedCount === 0){
      throw new BadRequestException(`Pokemon con id ${id} no existe`)
    }

    return ;
  }

  private handleException(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(`Ya existe un pokemon con las credenciales: ${JSON.stringify(error.keyValue)}`)
    }
    console.log(error)
    throw new InternalServerErrorException(`No se pudo actualizar el pokemon - mirar serveer logs`)
  }
}
