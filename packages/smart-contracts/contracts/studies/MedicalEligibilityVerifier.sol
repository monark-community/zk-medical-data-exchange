// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 11442352838441977333509317064343331331399074205372866356370575438730498062082;
    uint256 constant alphay  = 4381142031048142516464797630275283975536519683763685433964542338529448044554;
    uint256 constant betax1  = 1062082680387682267556594872748193325728741382775478161324139255323677876614;
    uint256 constant betax2  = 13324396680903016296002143914934681366423562606942749106842373070642334211536;
    uint256 constant betay1  = 1741101179093169485056354160429222940660721246497101196454594865041408276050;
    uint256 constant betay2  = 9434838185094443011035465366314781911002253175368503944715535403830493063895;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 17974505106833381407037416804584623050777230653046708373545665780844687184346;
    uint256 constant deltax2 = 9620891624248269582644643737834974276586639780573210585387526470388118848177;
    uint256 constant deltay1 = 2705191104875041398340173258733791555829518320939466873154874779416092640046;
    uint256 constant deltay2 = 12909430616595794890238681066103651533569994295238512498539766210902167793714;

    
    uint256 constant IC0x = 895743796000306115879805536204599891485144371495478642634013159732512362581;
    uint256 constant IC0y = 11876688624255555271892471895979135210152171743773075226212067266984925825931;
    
    uint256 constant IC1x = 1890586909496745048417959818215146925085296491601663883929004171866564570173;
    uint256 constant IC1y = 7628905899470870842929588881817475820311830259046044559575457430998118290350;
    
    uint256 constant IC2x = 11015167637239124017205196335578021234526095560393918327341356453901090117223;
    uint256 constant IC2y = 1186004212484029049182951334313963259304495217805747257374518334437951220193;
    
    uint256 constant IC3x = 2135385271903535452765795004830987501147690525896404652159497629462718372448;
    uint256 constant IC3y = 11656248792843525430333481716141714495354576930593236886571991810725279276388;
    
    uint256 constant IC4x = 4710487755154934823625170442551725883306500333032910215416012793521236127519;
    uint256 constant IC4y = 3346726694114779054256362208975052800982289965876510784905832626070652160808;
    
    uint256 constant IC5x = 6248819766073256209495070583972068871845045691636745152990401550918767935299;
    uint256 constant IC5y = 21459970378017662126589347864395904175530745078146028103926170948568345242913;
    
    uint256 constant IC6x = 21096288494372369026147433805993693707586141124988655681249157180615136895885;
    uint256 constant IC6y = 11209064335971466512548648269144285323848413772304767467215941247488181819360;
    
    uint256 constant IC7x = 18607336594275704060440461951379378088340683097009871283309756531753131243882;
    uint256 constant IC7y = 6973450280644388325026220506201176594717996624916493498213795819038294525324;
    
    uint256 constant IC8x = 20600902506529202152515760288502806655453727783799412348977806561269743740614;
    uint256 constant IC8y = 17692903266015164963716895713973565254563218799534944926933594074886409540808;
    
    uint256 constant IC9x = 3795582500916774604966041413160205106638098551500405353342413849012759583810;
    uint256 constant IC9y = 17911703123886169201545453705955143781172098169953527850758750774398052979038;
    
    uint256 constant IC10x = 5936001859515881243935011424632708284830191835684105300219444592675634558837;
    uint256 constant IC10y = 3733775200234132545468414011367750075715078728756695159103214870256714741831;
    
    uint256 constant IC11x = 1482750384468086568676906071792941532888931066671678614446866089830432427350;
    uint256 constant IC11y = 15969310296991458009397022587845483640396681073233514383577812607153746195715;
    
    uint256 constant IC12x = 4704707616626240977422722269289437533467062686779514240229766014503125441030;
    uint256 constant IC12y = 14825336771944439378246610289824605731978502802844054964085654796420972014376;
    
    uint256 constant IC13x = 15375607245333240332764515259796048287592093165114155545321230750835477992655;
    uint256 constant IC13y = 5348117386954016535108836180458514458106531394241973093801589679227035936479;
    
    uint256 constant IC14x = 5197137057509835804071437701167124025113970537968514726540699804372193344812;
    uint256 constant IC14y = 11862427042895457000628888297268132641885735140127707770389954147792081863429;
    
    uint256 constant IC15x = 13209573761933405155103765376163189761444988665227216380090404013020308844209;
    uint256 constant IC15y = 6779647253442409537764330843896761527364760663265314775978833583418162983345;
    
    uint256 constant IC16x = 13900993343493872068908605955169778008078067119925125095422243877455760438752;
    uint256 constant IC16y = 21284352803412133594353331981867258329787107094575004722518967801246476401582;
    
    uint256 constant IC17x = 17554119535937879183416834292835551431367312507347047323352008941030872347719;
    uint256 constant IC17y = 7156251900137835123085637624750535411736697023763669987337976214009556114670;
    
    uint256 constant IC18x = 8298142320750099556218066443652534709921722956524358448847148555195756562547;
    uint256 constant IC18y = 19176298750837268547440875771870058388194325555495369502286956209334711815663;
    
    uint256 constant IC19x = 10205858662701854912604866296609371598407727573066758167487772530155103300197;
    uint256 constant IC19y = 3045652938319983324679171145848400809740664934851223847220487590486917175332;
    
    uint256 constant IC20x = 13073471787730075016399552596754878387158842106538049317913772661632307817523;
    uint256 constant IC20y = 4325735955892986734618941379304349130481186526872412540424769452869119679190;
    
    uint256 constant IC21x = 10058640706150915408673928117865522712227751402665295951764223696812871484110;
    uint256 constant IC21y = 13353621593692530949807730649686266250321088667353553881771307121183186733912;
    
    uint256 constant IC22x = 14365570196645586950198389897826360787972635761508708116529786643716637184957;
    uint256 constant IC22y = 16500443530722727999107431111589882470601685208187735206473775799273088953016;
    
    uint256 constant IC23x = 18384068534351071644257065018256155662232605767874856360286782027809406027989;
    uint256 constant IC23y = 1529487143888967336134851355372683567136586509030887386376381760840631997866;
    
    uint256 constant IC24x = 9795571863683582714122166884011590840131112807601728552483156945209118473227;
    uint256 constant IC24y = 8704383950158831846483096447569387385442687094522241153261644476752008261624;
    
    uint256 constant IC25x = 4171401440087489481025846395111912343782077424476751119191464516711944468982;
    uint256 constant IC25y = 14957494980925507581928427990005869966730430091828974878068160206958868163988;
    
    uint256 constant IC26x = 20804525658203627185783250963030694214747643943144625885167224731063041096045;
    uint256 constant IC26y = 10314148364628926029132619646846639231072586642454499005039820709865480406703;
    
    uint256 constant IC27x = 11065710408414607137881760734769222498282028245499636524868355839559092498659;
    uint256 constant IC27y = 15129253880788768908535807205093415275754753337224291465217099915322261177774;
    
    uint256 constant IC28x = 12066426437194804161682172574989713572591402094548198298784006165942221331703;
    uint256 constant IC28y = 13334065624438761243834738407249211722017861308004292787647501754842771279205;
    
    uint256 constant IC29x = 18047305531720351773449777435990406212484739199105576442578887907548536148145;
    uint256 constant IC29y = 19891354640682908202355583879528593580469063995727815704859877157981291281637;
    
    uint256 constant IC30x = 12839490847978323183281961937745570969122482124428444488057077509885947426806;
    uint256 constant IC30y = 14385844963741626145348417768630032697736600003300955079082931170045274980049;
    
    uint256 constant IC31x = 13700911760516745762113473964697552783132495956916583533657200364548935936863;
    uint256 constant IC31y = 13477132202464101328030786917456562496407006493984574662500600179557611486932;
    
    uint256 constant IC32x = 27365656224532068540731095880492781169901991277377400376909857107562430188;
    uint256 constant IC32y = 9401126781879392757332816610927585876748979320260808199020501666470915373530;
    
    uint256 constant IC33x = 4009185710057121689186051025036588291574052769796007263221554509848514822913;
    uint256 constant IC33y = 4458282013269825018807387751208325273774041688493422252379839387205215787692;
    
    uint256 constant IC34x = 12074415584390969191407213154981910054356053411655240495344057137567054000361;
    uint256 constant IC34y = 17201108569932278833949415846544362585359249218173365695653088996979273823501;
    
    uint256 constant IC35x = 14442300317707143029275777432844463708190295190581944787755767312094500554919;
    uint256 constant IC35y = 13481636662549242871027004332670226597667048075016236276509634019400162173626;
    
    uint256 constant IC36x = 15707836507930181471785197661058237427976123264552439452402921553804301335294;
    uint256 constant IC36y = 9702452084075081104407739477858140108458706642081450109502687483776842809492;
    
    uint256 constant IC37x = 14607758761742626402375888709108789040133163371380156997758804742043663068586;
    uint256 constant IC37y = 13394955601888036392618190336211229089698150459321620911065878863536434953845;
    
    uint256 constant IC38x = 4733041436074868830758661996944788980522625935876311710624957526832220935477;
    uint256 constant IC38y = 4242266908541661654044003714407380095109692909361740024431577408800001489729;
    
    uint256 constant IC39x = 2417095813498831404232142256970445471152845906628340501226489399470239435930;
    uint256 constant IC39y = 3599246445050350474005882132346251759022866846761940285644033702279262965804;
    
    uint256 constant IC40x = 12180211941401230878624775567157575993475565852173681872547025882739824485134;
    uint256 constant IC40y = 7384577144182088185551561176776635555399130095670870288538464982577525302787;
    
    uint256 constant IC41x = 21337916889177907216374186428620710849147242312798749052905474733713756477390;
    uint256 constant IC41y = 386988210217034004897503615881702170755921181141944965783885323549529771217;
    
    uint256 constant IC42x = 8141194453999360044308134457995589528747784497850098818405457876597464236218;
    uint256 constant IC42y = 18017102724702251097203271050572363654891448815622821709211629110173259574672;
    
    uint256 constant IC43x = 16587284538444099481754146384219395676760402012276550291256439641128388532696;
    uint256 constant IC43y = 21317387841828244911598761196263726553734374919294376781213318886826174143448;
    
    uint256 constant IC44x = 4709216281042815270077742972630506850513963927386257835974907376013879997576;
    uint256 constant IC44y = 18200904721977023008769674142250074618368258423562074890103751080021538519235;
    
    uint256 constant IC45x = 17498560556834165637017531626043496799459392021054726369572273032672381181054;
    uint256 constant IC45y = 22110692952697591898542478117957109625911235453889673590630997732023204056;
    
    uint256 constant IC46x = 17615100770870060592013528060558651428396733404705828918259667075457082670497;
    uint256 constant IC46y = 11916494736579011270182198003231780508883737088541105212710555973495268600420;
    
    uint256 constant IC47x = 19129073717883327700771285360282019788511039806723363198503954567296318732113;
    uint256 constant IC47y = 1009354926179117468604846594535583803719005429191264713329647678961515605465;
    
    uint256 constant IC48x = 90423396567357171080883596905449679755169339194622444552578566268491034736;
    uint256 constant IC48y = 12157896914959505710139291396185847834343658918875495838691027322015961576297;
    
    uint256 constant IC49x = 2835259156288893907548485862406362232146983786707982142865828160359498078669;
    uint256 constant IC49y = 10417861471271064294738164971536031241486091981668068074227396607005144199014;
    
    uint256 constant IC50x = 10251795028146131365378760094990485966435789939474623746849146761264278239835;
    uint256 constant IC50y = 1050550100168608749822236795113321189436023581119893983748921511172683608582;
    
    uint256 constant IC51x = 374617601105034792331991355930884553839954090588884049603959357132809778326;
    uint256 constant IC51y = 2023679594375908063661679770859524066332396214124856415903766191629776761538;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[51] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                
                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))
                
                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))
                
                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))
                
                g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))
                
                g1_mulAccC(_pVk, IC19x, IC19y, calldataload(add(pubSignals, 576)))
                
                g1_mulAccC(_pVk, IC20x, IC20y, calldataload(add(pubSignals, 608)))
                
                g1_mulAccC(_pVk, IC21x, IC21y, calldataload(add(pubSignals, 640)))
                
                g1_mulAccC(_pVk, IC22x, IC22y, calldataload(add(pubSignals, 672)))
                
                g1_mulAccC(_pVk, IC23x, IC23y, calldataload(add(pubSignals, 704)))
                
                g1_mulAccC(_pVk, IC24x, IC24y, calldataload(add(pubSignals, 736)))
                
                g1_mulAccC(_pVk, IC25x, IC25y, calldataload(add(pubSignals, 768)))
                
                g1_mulAccC(_pVk, IC26x, IC26y, calldataload(add(pubSignals, 800)))
                
                g1_mulAccC(_pVk, IC27x, IC27y, calldataload(add(pubSignals, 832)))
                
                g1_mulAccC(_pVk, IC28x, IC28y, calldataload(add(pubSignals, 864)))
                
                g1_mulAccC(_pVk, IC29x, IC29y, calldataload(add(pubSignals, 896)))
                
                g1_mulAccC(_pVk, IC30x, IC30y, calldataload(add(pubSignals, 928)))
                
                g1_mulAccC(_pVk, IC31x, IC31y, calldataload(add(pubSignals, 960)))
                
                g1_mulAccC(_pVk, IC32x, IC32y, calldataload(add(pubSignals, 992)))
                
                g1_mulAccC(_pVk, IC33x, IC33y, calldataload(add(pubSignals, 1024)))
                
                g1_mulAccC(_pVk, IC34x, IC34y, calldataload(add(pubSignals, 1056)))
                
                g1_mulAccC(_pVk, IC35x, IC35y, calldataload(add(pubSignals, 1088)))
                
                g1_mulAccC(_pVk, IC36x, IC36y, calldataload(add(pubSignals, 1120)))
                
                g1_mulAccC(_pVk, IC37x, IC37y, calldataload(add(pubSignals, 1152)))
                
                g1_mulAccC(_pVk, IC38x, IC38y, calldataload(add(pubSignals, 1184)))
                
                g1_mulAccC(_pVk, IC39x, IC39y, calldataload(add(pubSignals, 1216)))
                
                g1_mulAccC(_pVk, IC40x, IC40y, calldataload(add(pubSignals, 1248)))
                
                g1_mulAccC(_pVk, IC41x, IC41y, calldataload(add(pubSignals, 1280)))
                
                g1_mulAccC(_pVk, IC42x, IC42y, calldataload(add(pubSignals, 1312)))
                
                g1_mulAccC(_pVk, IC43x, IC43y, calldataload(add(pubSignals, 1344)))
                
                g1_mulAccC(_pVk, IC44x, IC44y, calldataload(add(pubSignals, 1376)))
                
                g1_mulAccC(_pVk, IC45x, IC45y, calldataload(add(pubSignals, 1408)))
                
                g1_mulAccC(_pVk, IC46x, IC46y, calldataload(add(pubSignals, 1440)))
                
                g1_mulAccC(_pVk, IC47x, IC47y, calldataload(add(pubSignals, 1472)))
                
                g1_mulAccC(_pVk, IC48x, IC48y, calldataload(add(pubSignals, 1504)))
                
                g1_mulAccC(_pVk, IC49x, IC49y, calldataload(add(pubSignals, 1536)))
                
                g1_mulAccC(_pVk, IC50x, IC50y, calldataload(add(pubSignals, 1568)))
                
                g1_mulAccC(_pVk, IC51x, IC51y, calldataload(add(pubSignals, 1600)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            
            checkField(calldataload(add(_pubSignals, 384)))
            
            checkField(calldataload(add(_pubSignals, 416)))
            
            checkField(calldataload(add(_pubSignals, 448)))
            
            checkField(calldataload(add(_pubSignals, 480)))
            
            checkField(calldataload(add(_pubSignals, 512)))
            
            checkField(calldataload(add(_pubSignals, 544)))
            
            checkField(calldataload(add(_pubSignals, 576)))
            
            checkField(calldataload(add(_pubSignals, 608)))
            
            checkField(calldataload(add(_pubSignals, 640)))
            
            checkField(calldataload(add(_pubSignals, 672)))
            
            checkField(calldataload(add(_pubSignals, 704)))
            
            checkField(calldataload(add(_pubSignals, 736)))
            
            checkField(calldataload(add(_pubSignals, 768)))
            
            checkField(calldataload(add(_pubSignals, 800)))
            
            checkField(calldataload(add(_pubSignals, 832)))
            
            checkField(calldataload(add(_pubSignals, 864)))
            
            checkField(calldataload(add(_pubSignals, 896)))
            
            checkField(calldataload(add(_pubSignals, 928)))
            
            checkField(calldataload(add(_pubSignals, 960)))
            
            checkField(calldataload(add(_pubSignals, 992)))
            
            checkField(calldataload(add(_pubSignals, 1024)))
            
            checkField(calldataload(add(_pubSignals, 1056)))
            
            checkField(calldataload(add(_pubSignals, 1088)))
            
            checkField(calldataload(add(_pubSignals, 1120)))
            
            checkField(calldataload(add(_pubSignals, 1152)))
            
            checkField(calldataload(add(_pubSignals, 1184)))
            
            checkField(calldataload(add(_pubSignals, 1216)))
            
            checkField(calldataload(add(_pubSignals, 1248)))
            
            checkField(calldataload(add(_pubSignals, 1280)))
            
            checkField(calldataload(add(_pubSignals, 1312)))
            
            checkField(calldataload(add(_pubSignals, 1344)))
            
            checkField(calldataload(add(_pubSignals, 1376)))
            
            checkField(calldataload(add(_pubSignals, 1408)))
            
            checkField(calldataload(add(_pubSignals, 1440)))
            
            checkField(calldataload(add(_pubSignals, 1472)))
            
            checkField(calldataload(add(_pubSignals, 1504)))
            
            checkField(calldataload(add(_pubSignals, 1536)))
            
            checkField(calldataload(add(_pubSignals, 1568)))
            
            checkField(calldataload(add(_pubSignals, 1600)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
