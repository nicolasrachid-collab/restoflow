import { Controller, Post, Patch, Body, Param } from '@nestjs/common';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post('find-or-create')
  async findOrCreate(@Body() body: { phone: string; name?: string }) {
    return this.customersService.findOrCreate(body.phone, body.name);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: { email?: string; name?: string }) {
    return this.customersService.update(id, body);
  }
}

