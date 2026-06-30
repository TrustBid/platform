import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PublicService } from './public.service';
import { ProjectsQueryDto } from './dto/projects-query.dto';
import { CreateDonationDto } from './dto/create-donation.dto';

@Public()
@Controller()
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  // GET /ngo
  @Get('ngo')
  getNgo() {
    return this.publicService.getNgo();
  }

  // GET /projects[?q=&category=]
  @Get('projects')
  getProjects(@Query() query: ProjectsQueryDto) {
    return this.publicService.getProjects(query);
  }

  // GET /projects/:id
  @Get('projects/:id')
  getProject(@Param('id', ParseUUIDPipe) id: string) {
    return this.publicService.getProject(id);
  }

  // GET /categories
  @Get('categories')
  getCategories() {
    return this.publicService.getCategories();
  }

  // POST /donations
  @Post('donations')
  createDonation(@Body() body: CreateDonationDto) {
    return this.publicService.createDonation(body);
  }
}
