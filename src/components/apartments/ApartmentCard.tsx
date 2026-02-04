import React from 'react';
import { Apartment, Bag } from '../../types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from
  '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { BagStatus } from '../bags/BagStatus';
import { BedDouble, Coffee, Key, Edit, Calendar, Link } from 'lucide-react';
interface ApartmentCardProps {
  apartment: Apartment;
  bag: Bag;
  onEdit: (apt: Apartment) => void;
}
export function ApartmentCard({ apartment, bag, onEdit }: ApartmentCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{apartment.name}</CardTitle>
            <CardDescription className="mt-1">
              {apartment.address}
            </CardDescription>
          </div>
          <BagStatus status={bag?.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BedDouble className="h-4 w-4" />
            <span>{apartment.bedCount} lit(s)</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Coffee className="h-4 w-4" />
            <span className="capitalize">{apartment.coffeeType}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Key className="h-4 w-4" />
            <span>
              {apartment.hasCodeBox ?
                `Boîtier: ${apartment.codeBox}` :
                'Pas de boîtier'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-semibold">{apartment.cleaningPrice}€</span>
            <span>/ ménage</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4" />
          {apartment.iCalLink ?
            <div className="flex items-center gap-2">
              <Badge variant="success" className="text-xs">
                <Link className="h-3 w-3 mr-1" />
                iCal connecté
              </Badge>
            </div> :

            <span className="text-muted-foreground">iCal non configuré</span>
          }
        </div>

        {apartment.description &&
          <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
            {apartment.description}
          </div>
        }
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onEdit(apartment)}>

          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </CardFooter>
    </Card>);

}